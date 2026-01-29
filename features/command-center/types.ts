
export interface Agent {
    id: string;
    name: string;
    role: string;
    description: string;
    status: 'idle' | 'working' | 'done';
    task?: string;
    color: string; // 'emerald' | 'blue' | 'purple' | 'orange'
    iconName: string;
}

export interface ChatMessage {
    id: string;
    sender: 'user' | 'system' | 'agent';
    agentName?: string;
    text: string;
    timestamp: Date;
}

export interface OrchestratorResponse {
    reply: string;
    delegations: {
        agentId: string;
        taskDescription: string;
    }[];
}
