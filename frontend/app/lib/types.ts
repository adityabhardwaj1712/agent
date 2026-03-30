// frontend/app/lib/types.ts

export interface Stats {
  active_agents: number;
  total_tasks: number;
  tasks_completed: number;
  success_rate: number;
  avg_latency: number;
  total_cost: number;
  pending_approvals: number;
  active_events: number;
  error_rate: number;
}

export interface AnalyticsSummary {
  success_rate: number;
  total_tasks: number;
  avg_latency: number;
  total_cost: number;
  active_agents: number;
}

export interface FleetHealth {
  running: number;
  idle: number;
  cooldown: number;
  offline: number;
  total: number;
}

export interface Task {
  task_id: string;
  description: string;
  status: string;
  created_at: string;
  agent_id?: string;
  user_id: string;
  execution_time_ms?: number;
  payload?: string;
}

export interface Agent {
  agent_id: string;
  name: string;
  role?: string;
  description?: string;
  model_name?: string;
  model?: string; // Compatibility
  status?: string;
  owner_id: string;
}

export interface TimePoint {
  time: string;
  value: number;
}
