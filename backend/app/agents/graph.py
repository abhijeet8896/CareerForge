from langgraph.graph import StateGraph, END
from app.agents.state import CareerForgeState
from app.agents.supervisor import supervisor_node, route_after_supervisor
from app.agents.resume_agent import resume_intelligence_node
from app.agents.github_agent import github_skill_node
from app.agents.recruiter_agent import recruiter_simulation_node
from app.agents.ats_agent import ats_optimization_node
from app.agents.market_agent import market_intelligence_node
from app.agents.project_agent import project_generator_node
from app.agents.roadmap_agent import roadmap_planner_node
from app.agents.scoring import score_aggregation_node
import logging

logger = logging.getLogger(__name__)

# FIX: Do NOT build at module import time — lazy-init to avoid startup crash
# when OPENAI_API_KEY is missing or DB is not ready.
_graph = None


def get_graph():
    global _graph
    if _graph is None:
        logger.info("[Graph] Building LangGraph pipeline...")
        g = StateGraph(CareerForgeState)

        g.add_node("supervisor",       supervisor_node)
        g.add_node("resume_agent",     resume_intelligence_node)
        g.add_node("github_agent",     github_skill_node)
        g.add_node("recruiter_agent",  recruiter_simulation_node)
        g.add_node("ats_agent",        ats_optimization_node)
        g.add_node("market_agent",     market_intelligence_node)
        g.add_node("project_agent",    project_generator_node)
        g.add_node("roadmap_agent",    roadmap_planner_node)
        g.add_node("score_aggregator", score_aggregation_node)

        g.set_entry_point("supervisor")

        g.add_conditional_edges("supervisor", route_after_supervisor, {
            "resume_agent": "resume_agent",
            "end": END,
        })

        g.add_edge("resume_agent",    "github_agent")
        g.add_edge("github_agent",    "recruiter_agent")
        g.add_edge("recruiter_agent", "ats_agent")
        g.add_edge("ats_agent",       "market_agent")
        g.add_edge("market_agent",    "project_agent")
        g.add_edge("project_agent",   "roadmap_agent")
        g.add_edge("roadmap_agent",   "score_aggregator")
        g.add_edge("score_aggregator", END)

        _graph = g.compile()
        logger.info("[Graph] Pipeline compiled successfully.")
    return _graph
