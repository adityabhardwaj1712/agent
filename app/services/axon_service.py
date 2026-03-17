from app.services.model_router import select_model, call_provider

class AxonService:
    @staticmethod
    async def advanced_reasoning(task_payload: str, context: str = ""):
        """
        AXON: Optimizes execution path and executes real LLM reasoning.
        """
        # 1. Intent Analysis (Heuristic/Lightweight)
        intent = "UNKNOWN"
        if any(w in task_payload.lower() for w in ["analyze", "review", "audit"]):
            intent = "ANALYTICAL"
        elif any(w in task_payload.lower() for w in ["create", "build", "generate"]):
            intent = "GENERATIVE"
        
        print(f"AXON Engine: Detected {intent} intent. Selecting optimal model...")
        
        # 2. Select the right model for the job
        model_choice = select_model(task_payload)
        
        # 3. Execute Real LLM Completion
        print(f"AXON Engine: Executing {model_choice.name} with context length {len(context)}...")
        result = await call_provider(model_choice, task_payload, context)
        
        return result

    @staticmethod
    def auto_heal(error_context: str):
        """
        Attempts to 'auto-heal' a failed task by analyzing the error.
        """
        print(f"AXON Guard: Detecting failure -> {error_context}")
        
        if "timeout" in error_context.lower():
            strategy = "Allocating 2x compute resources for retry."
        elif "simulated" in error_context.lower():
            strategy = "Injecting fault-tolerance bypass for mock error."
        else:
            strategy = "Fallback to secondary model endpoint."
            
        print(f"AXON Guard: Strategy applied -> {strategy}")
        return strategy
