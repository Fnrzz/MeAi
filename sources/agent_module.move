module meai::agent_module {
    use sui::event;
    use sui::clock::{Self, Clock};
    use sui::coin::{Self, Coin};
    use sui::sui::SUI;
    use sui::vec_set::{Self, VecSet};
    use std::string::String;

    public struct Agent has key, store {
        id: UID,
        name: String,
        owner: address,
        system_prompt: String,
        allowed_models: VecSet<String>,
        daily_budget: u64,
        spent_today: u64,
        total_spent: u64,
        last_reset_epoch: u64,
        is_active: bool,
    }

    public struct AgentRegistry has key {
        id: UID,
        total_agents: u64,
    }

    public struct AgentRegistered has copy, drop {
        agent_id: ID,
        name: String,
        owner: address,
        timestamp: u64,
    }

    public struct AgentFunded has copy, drop {
        agent_id: ID,
        amount: u64,
        timestamp: u64,
    }

    public struct AgentDeducted has copy, drop {
        agent_id: ID,
        amount: u64,
        model: String,
        remaining_budget: u64,
        timestamp: u64,
    }

    public struct AgentDeactivated has copy, drop {
        agent_id: ID,
        timestamp: u64,
    }

    const ENotOwner: u64 = 1;
    const EInsufficientBudget: u64 = 2;
    const EAgentInactive: u64 = 3;
    const ENotAuthorized: u64 = 4;

    fun init(ctx: &mut TxContext) {
        transfer::share_object(AgentRegistry {
            id: object::new(ctx),
            total_agents: 0,
        });
    }

    public fun register_agent(
        registry: &mut AgentRegistry,
        name: String,
        owner: address,
        system_prompt: String,
        allowed_models: vector<String>,
        daily_budget: u64,
        clock: &Clock,
        ctx: &mut TxContext,
    ): ID {
        let mut models = vec_set::empty();
        let mut i = 0;
        while (i < vector::length(&allowed_models)) {
            vec_set::insert(&mut models, *vector::borrow(&allowed_models, i));
            i = i + 1;
        };

        let agent_name = name;

        let agent = Agent {
            id: object::new(ctx),
            name: agent_name,
            owner,
            system_prompt,
            allowed_models: models,
            daily_budget,
            spent_today: 0,
            total_spent: 0,
            last_reset_epoch: 0,
            is_active: true,
        };

        let agent_id = object::id(&agent);
        transfer::transfer(agent, owner);

        registry.total_agents = registry.total_agents + 1;

        event::emit(AgentRegistered {
            agent_id,
            name: agent_name,
            owner,
            timestamp: clock::timestamp_ms(clock),
        });

        agent_id
    }

    public fun fund_agent(
        agent: &mut Agent,
        payment: Coin<SUI>,
        clock: &Clock,
        ctx: &TxContext,
    ) {
        let amount = coin::value(&payment);
        agent.daily_budget = agent.daily_budget + (amount / 1000000000);

        transfer::public_transfer(payment, tx_context::sender(ctx));

        event::emit(AgentFunded {
            agent_id: object::id(agent),
            amount,
            timestamp: clock::timestamp_ms(clock),
        });
    }

    public fun deduct_agent(
        agent: &mut Agent,
        amount: u64,
        model: String,
        clock: &Clock,
    ) {
        assert!(agent.is_active, EAgentInactive);

        let epoch = clock::timestamp_ms(clock) / 86400000;
        if (epoch != agent.last_reset_epoch) {
            agent.spent_today = 0;
            agent.last_reset_epoch = epoch;
        };

        assert!(agent.spent_today + amount <= agent.daily_budget, EInsufficientBudget);

        agent.spent_today = agent.spent_today + amount;
        agent.total_spent = agent.total_spent + amount;

        event::emit(AgentDeducted {
            agent_id: object::id(agent),
            amount,
            model,
            remaining_budget: agent.daily_budget - agent.spent_today,
            timestamp: clock::timestamp_ms(clock),
        });
    }

    public fun deactivate_agent(
        agent: &mut Agent,
        clock: &Clock,
        ctx: &TxContext,
    ) {
        assert!(agent.owner == tx_context::sender(ctx) || tx_context::sender(ctx) == @meai, ENotAuthorized);
        agent.is_active = false;

        event::emit(AgentDeactivated {
            agent_id: object::id(agent),
            timestamp: clock::timestamp_ms(clock),
        });
    }

    public fun update_system_prompt(
        agent: &mut Agent,
        new_prompt: String,
        ctx: &TxContext,
    ) {
        assert!(agent.owner == tx_context::sender(ctx), ENotOwner);
        agent.system_prompt = new_prompt;
    }

    public fun is_model_allowed(agent: &Agent, model: &String): bool {
        vec_set::contains(&agent.allowed_models, model)
    }

    public fun budget_remaining(agent: &Agent): u64 {
        if (agent.daily_budget > agent.spent_today) {
            agent.daily_budget - agent.spent_today
        } else {
            0
        }
    }

    public fun total_agents(registry: &AgentRegistry): u64 {
        registry.total_agents
    }

    #[test_only]
    public fun create_registry_for_testing(ctx: &mut TxContext) {
        init(ctx);
    }
}
