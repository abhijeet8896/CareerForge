from app.agents.state import CareerForgeState
from app.core.config import settings
import logging, time

logger = logging.getLogger(__name__)

SKILL_SIGNALS: dict[str, list[str]] = {
    "react":       [".jsx", ".tsx", "useState", "useEffect", "React.", "react-dom", "createRoot"],
    "python":      [".py", "def ", "import ", "flask", "django", "fastapi", "uvicorn"],
    "javascript":  [".js", "async ", "await ", "const ", "addEventListener", "module.exports"],
    "typescript":  [".ts", ".tsx", "interface ", ": string", ": number", ": boolean", "type "],
    "nodejs":      ["express", "require(", "app.listen", "npm", "node_modules", "package.json"],
    "docker":      ["Dockerfile", "docker-compose", "FROM ", "EXPOSE", "docker build"],
    "sql":         [".sql", "SELECT ", "CREATE TABLE", "JOIN ", "WHERE ", "INSERT INTO"],
    "css":         [".css", ".scss", "tailwind", "styled-components", "@apply", "flexbox"],
    "testing":     ["jest", "pytest", "unittest", "describe(", "def test_", "it(", "expect("],
    "api":         ["axios", "fetch(", "requests.", "httpx", "aiohttp", "XMLHttpRequest"],
    "aws":         ["boto3", "aws-sdk", "s3.", "lambda", "ec2", "iam", "cloudformation"],
    "git":         [".gitignore", "README.md", ".github", "CHANGELOG"],
    "mongodb":     ["mongoose", "MongoClient", "findOne", "aggregate", "ObjectId"],
    "redis":       ["redis", "aioredis", "RedisClient", "SETEX", "GETEX"],
    "graphql":     ["graphql", "gql`", "useQuery", "useMutation", "schema.graphql"],
    "nextjs":      ["next/", "getServerSideProps", "getStaticProps", "next.config"],
    "tailwind":    ["tailwind", "className=\"", "bg-", "text-", "flex "],
}


def github_skill_node(state: CareerForgeState) -> dict:
    username = (state.get("github_username") or "").strip()
    token    = settings.GITHUB_TOKEN

    if not username:
        logger.info("[GitHubAgent] Skipped — no GitHub username provided.")
        return {
            "github_analysis": {
                "note": "No GitHub username provided. Add it on registration or the upload form.",
                "verified_skills": [],
                "repos_analyzed": 0,
                "repos": [],
                "total_public_repos": 0,
            },
            "completed_nodes": ["github_agent"],
        }

    if not token:
        logger.warning("[GitHubAgent] Skipped — GITHUB_TOKEN not set.")
        return {
            "github_analysis": {
                "username": username,
                "note": "GITHUB_TOKEN not configured. Add it to backend/.env for skill verification.",
                "verified_skills": [],
                "repos_analyzed": 0,
                "repos": [],
                "total_public_repos": 0,
            },
            "completed_nodes": ["github_agent"],
        }

    try:
        from github import Github, GithubException
        start = time.time()
        g    = Github(token, timeout=15)
        user = g.get_user(username)
        all_repos = list(user.get_repos(type="owner", sort="updated"))[:15]
        repos = [r for r in all_repos if not r.fork]

        skill_hits: dict[str, int] = {}
        repos_data: list[dict]     = []

        for repo in repos:
            try:
                file_texts = _collect_file_texts(repo)
                repo_skills: list[str] = []
                for skill, signals in SKILL_SIGNALS.items():
                    hits = sum(1 for t in file_texts if any(sig in t for sig in signals))
                    if hits > 0:
                        skill_hits[skill] = skill_hits.get(skill, 0) + hits
                        repo_skills.append(skill)
                repos_data.append({
                    "name":       repo.name,
                    "stars":      repo.stargazers_count,
                    "language":   repo.language,
                    "skills":     repo_skills,
                    "updated_at": str(repo.updated_at)[:10],
                    "url":        repo.html_url,
                    "description": repo.description or "",
                })
            except Exception as e:
                logger.debug(f"[GitHubAgent] Skipping repo {repo.name}: {e}")

        # Map resume-claimed skills to verified status
        explicit_lower = {s.lower() for s in state.get("resume_profile", {}).get("skills_explicit", [])}
        verified: list[dict] = []
        for skill, count in sorted(skill_hits.items(), key=lambda x: -x[1]):
            confidence = round(min(count / 5.0, 1.0), 2)
            verified.append({
                "skill":             skill,
                "confidence":        confidence,
                "repo_hits":         count,
                "claimed_on_resume": skill.lower() in explicit_lower,
                "verdict":           "verified" if confidence >= 0.4 else "weak",
            })

        elapsed = round((time.time() - start) * 1000)
        logger.info(f"[GitHubAgent] Analysed {len(repos_data)} repos, {len(verified)} skills in {elapsed}ms")

        return {
            "github_analysis": {
                "username":          username,
                "profile_url":       f"https://github.com/{username}",
                "total_public_repos": user.public_repos,
                "repos_analyzed":    len(repos_data),
                "repos":             repos_data,
                "verified_skills":   verified,
            },
            "completed_nodes": ["github_agent"],
        }

    except Exception as e:
        logger.error(f"[GitHubAgent] Error: {e}")
        return {
            "github_analysis": {
                "username":        username,
                "error":           str(e),
                "note":            "GitHub API error — check GITHUB_TOKEN is valid and not rate-limited.",
                "verified_skills": [],
                "repos_analyzed":  0,
                "repos":           [],
            },
            "errors":          [f"GitHubAgent: {str(e)}"],
            "completed_nodes": ["github_agent"],
        }


def _collect_file_texts(repo, path: str = "", depth: int = 0) -> list[str]:
    """Recursively collect file paths + first 400 bytes of content."""
    if depth > 2:
        return []
    texts: list[str] = []
    try:
        items = list(repo.get_contents(path))[:30]
        for item in items:
            if item.type == "dir":
                texts.extend(_collect_file_texts(repo, item.path, depth + 1))
            else:
                texts.append(item.path)
                try:
                    content = item.decoded_content.decode("utf-8", errors="ignore")[:400]
                    texts.append(content)
                except Exception:
                    pass
    except Exception:
        pass
    return texts
