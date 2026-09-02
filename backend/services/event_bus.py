"""
ORCA 4.0 Inter-Agent Event Bus & Cross-Agent Message Protocol
Enables asynchronous, typed event dispatching and cross-agent context handoffs
between specialist agents in the ORCA decision pipeline.
"""

import time
import asyncio
from typing import Dict, Any, List, Callable, Awaitable

class AgentMessage:
    def __init__(self, sender: str, event_type: str, payload: Dict[str, Any], confidence: float = 1.0):
        self.sender = sender
        self.event_type = event_type
        self.payload = payload
        self.confidence = confidence
        self.timestamp = time.time()

    def to_dict(self) -> Dict[str, Any]:
        return {
            "sender": self.sender,
            "event_type": self.event_type,
            "confidence": self.confidence,
            "timestamp": self.timestamp,
            "payload": self.payload
        }

class AgentEventBus:
    def __init__(self):
        self._subscribers: Dict[str, List[Callable[[AgentMessage], Awaitable[None]]]] = {}
        self._event_log: List[AgentMessage] = []

    def subscribe(self, event_type: str, callback: Callable[[AgentMessage], Awaitable[None]]):
        if event_type not in self._subscribers:
            self._subscribers[event_type] = []
        self._subscribers[event_type].append(callback)

    async def publish(self, message: AgentMessage):
        self._event_log.append(message)
        if message.event_type in self._subscribers:
            tasks = [sub(message) for sub in self._subscribers[message.event_type]]
            await asyncio.gather(*tasks, return_exceptions=True)

    def get_event_history(self, limit: int = 50) -> List[Dict[str, Any]]:
        return [msg.to_dict() for msg in self._event_log[-limit:]]

agent_event_bus = AgentEventBus()
