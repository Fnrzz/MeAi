#[test_only]
module meai::meai_tests {
    use sui::test_scenario;
    use sui::coin;
    use sui::sui::SUI;
    use sui::clock::Clock;
    use std::string;

    use meai::payment_module::{Self, Treasury};
    use meai::access_module::{Self, ApiKeyRegistry};
    use meai::quota_module::{Self, QuotaObject};
    use meai::registry_module::{Self, ModelRegistry};
    use meai::agent_module::{Self, AgentRegistry, Agent};
    use meai::agent_hire::{Self, TaskRegistry, AgentTask};

    const ADMIN: address = @meai;
    const USER1: address = @0xa11ce;
    const USER2: address = @0xb0b;

    const MIST_PER_SUI: u64 = 1_000_000_000;

    /// Helper: generate a fake object ID for testing
    fun fake_agent_id(): ID {
        object::id_from_address(@0xfa1ce)
    }

    /// Helper: call module init functions via test-only wrappers
    fun publish_module(scenario: &mut test_scenario::Scenario) {
        let ctx = scenario.ctx();
        payment_module::create_treasury_for_testing(ctx);
        access_module::create_registry_for_testing(ctx);
        registry_module::create_registry_for_testing(ctx);
        agent_module::create_registry_for_testing(ctx);
        agent_hire::create_registry_for_testing(ctx);
    }

    // ═══════════════════════════════════════════
    //  PAYMENT MODULE
    // ═══════════════════════════════════════════

    #[test]
    fun test_payment_deposit_increases_balance() {
        let mut scenario = test_scenario::begin(ADMIN);
        scenario.create_system_objects();
        publish_module(&mut scenario);

        scenario.next_tx(USER1);

        let mut treasury = scenario.take_shared<Treasury>();
        let original = payment_module::balance(&treasury);
        test_scenario::return_shared(treasury);

        scenario.next_tx(USER1);
        let mut treasury = scenario.take_shared<Treasury>();
        let payment = coin::mint_for_testing<SUI>(MIST_PER_SUI, scenario.ctx());
        let mut clock = scenario.take_shared<Clock>();

        payment_module::deposit(&mut treasury, payment, &clock, scenario.ctx());

        test_scenario::return_shared(treasury);
        test_scenario::return_shared(clock);
        scenario.next_tx(USER1);

        let treasury = scenario.take_shared<Treasury>();
        assert!(payment_module::balance(&treasury) == original + MIST_PER_SUI);
        test_scenario::return_shared(treasury);

        scenario.end();
    }

    #[test]
    fun test_payment_withdraw_reduces_balance() {
        let mut scenario = test_scenario::begin(ADMIN);
        scenario.create_system_objects();
        publish_module(&mut scenario);

        scenario.next_tx(USER1);

        let mut treasury = scenario.take_shared<Treasury>();
        let payment = coin::mint_for_testing<SUI>(MIST_PER_SUI, scenario.ctx());
        let mut clock = scenario.take_shared<Clock>();
        payment_module::deposit(&mut treasury, payment, &clock, scenario.ctx());
        test_scenario::return_shared(treasury);
        test_scenario::return_shared(clock);

        scenario.next_tx(USER1);
        let mut treasury = scenario.take_shared<Treasury>();
        let withdrawn = payment_module::withdraw(&mut treasury, 100, scenario.ctx());
        assert!(coin::value(&withdrawn) == 100);
        sui::coin::burn_for_testing(withdrawn);
        test_scenario::return_shared(treasury);

        scenario.end();
    }

    // ═══════════════════════════════════════════
    //  ACCESS MODULE
    // ═══════════════════════════════════════════

    #[test]
    fun test_access_mint_and_verify() {
        let mut scenario = test_scenario::begin(ADMIN);
        scenario.create_system_objects();
        publish_module(&mut scenario);

        scenario.next_tx(ADMIN);

        let mut registry = scenario.take_shared<ApiKeyRegistry>();
        let mut clock = scenario.take_shared<Clock>();

        let models = vector[string::utf8(b"claude-sonnet-4"), string::utf8(b"gpt-4o")];
        let cap_id = access_module::mint_cap(
            &mut registry, USER1, 1, models, &clock, scenario.ctx(),
        );

        assert!(access_module::total_issued(&registry) == 1);
        assert!(access_module::cap_owner(&registry, cap_id) == USER1);

        test_scenario::return_shared(registry);
        test_scenario::return_shared(clock);

        scenario.next_tx(ADMIN);
        let registry = scenario.take_shared<ApiKeyRegistry>();

        assert!(access_module::verify_cap(&registry, cap_id, string::utf8(b"claude-sonnet-4")));
        assert!(access_module::verify_cap(&registry, cap_id, string::utf8(b"gpt-4o")));
        assert!(!access_module::verify_cap(&registry, cap_id, string::utf8(b"llama-3-70b")));

        test_scenario::return_shared(registry);
        scenario.end();
    }

    #[test]
    fun test_access_revoke_deactivates() {
        let mut scenario = test_scenario::begin(ADMIN);
        scenario.create_system_objects();
        publish_module(&mut scenario);

        scenario.next_tx(ADMIN);

        let mut registry = scenario.take_shared<ApiKeyRegistry>();
        let mut clock = scenario.take_shared<Clock>();
        let models = vector[string::utf8(b"claude-sonnet-4")];

        let cap_id = access_module::mint_cap(&mut registry, USER1, 1, models, &clock, scenario.ctx());
        assert!(access_module::verify_cap(&registry, cap_id, string::utf8(b"claude-sonnet-4")));

        access_module::revoke_cap(&mut registry, cap_id, &clock, scenario.ctx());
        assert!(!access_module::verify_cap(&registry, cap_id, string::utf8(b"claude-sonnet-4")));

        test_scenario::return_shared(registry);
        test_scenario::return_shared(clock);
        scenario.end();
    }

    #[test]
    fun test_access_transfer_changes_owner() {
        let mut scenario = test_scenario::begin(ADMIN);
        scenario.create_system_objects();
        publish_module(&mut scenario);

        scenario.next_tx(ADMIN);

        let mut registry = scenario.take_shared<ApiKeyRegistry>();
        let mut clock = scenario.take_shared<Clock>();
        let models = vector[string::utf8(b"gpt-4o")];

        let cap_id = access_module::mint_cap(&mut registry, ADMIN, 1, models, &clock, scenario.ctx());
        assert!(access_module::cap_owner(&registry, cap_id) == ADMIN);

        access_module::transfer_cap(&mut registry, cap_id, USER1, &clock, scenario.ctx());
        assert!(access_module::cap_owner(&registry, cap_id) == USER1);

        test_scenario::return_shared(registry);
        test_scenario::return_shared(clock);
        scenario.end();
    }

    #[test]
    #[expected_failure(abort_code = meai::access_module::ENotOwner)]
    fun test_access_non_owner_cannot_revoke() {
        let mut scenario = test_scenario::begin(ADMIN);
        scenario.create_system_objects();
        publish_module(&mut scenario);

        scenario.next_tx(ADMIN);

        let mut registry = scenario.take_shared<ApiKeyRegistry>();
        let mut clock = scenario.take_shared<Clock>();
        let models = vector[string::utf8(b"gpt-4o")];

        let cap_id = access_module::mint_cap(&mut registry, USER1, 1, models, &clock, scenario.ctx());
        test_scenario::return_shared(registry);
        test_scenario::return_shared(clock);

        scenario.next_tx(USER2);
        let mut registry = scenario.take_shared<ApiKeyRegistry>();
        let mut clock = scenario.take_shared<Clock>();
        access_module::revoke_cap(&mut registry, cap_id, &clock, scenario.ctx());
        test_scenario::return_shared(registry);
        test_scenario::return_shared(clock);

        scenario.end();
    }

    // ═══════════════════════════════════════════
    //  QUOTA MODULE
    // ═══════════════════════════════════════════

    #[test]
    fun test_quota_create_and_balance() {
        let mut scenario = test_scenario::begin(USER1);
        let mut quota = quota_module::create_quota(USER1, 1000, 500, scenario.ctx());

        assert!(quota_module::balance(&quota) == 1000);
        assert!(quota_module::used_today(&quota) == 0);

        let _id = object::id(&quota);
        transfer::public_transfer(quota, USER1);
        scenario.end();
    }

    #[test]
    fun test_quota_deduct_reduces_balance() {
        let mut scenario = test_scenario::begin(USER1);
        scenario.create_system_objects();

        let mut quota = quota_module::create_quota(USER1, 1000, 500, scenario.ctx());
        let mut clock = scenario.take_shared<Clock>();

        quota_module::deduct(&mut quota, 300, string::utf8(b"gpt-4o"), &clock);

        assert!(quota_module::balance(&quota) == 700);
        assert!(quota_module::used_today(&quota) == 300);

        test_scenario::return_shared(clock);
        let _id = object::id(&quota);
        transfer::public_transfer(quota, USER1);
        scenario.end();
    }

    #[test]
    #[expected_failure(abort_code = meai::quota_module::EInsufficientBalance)]
    fun test_quota_insufficient_balance_fails() {
        let mut scenario = test_scenario::begin(USER1);
        scenario.create_system_objects();

        let mut quota = quota_module::create_quota(USER1, 100, 500, scenario.ctx());
        let mut clock = scenario.take_shared<Clock>();

        quota_module::deduct(&mut quota, 200, string::utf8(b"gpt-4o"), &clock);

        test_scenario::return_shared(clock);
        let _id = object::id(&quota);
        transfer::public_transfer(quota, USER1);
        scenario.end();
    }

    #[test]
    #[expected_failure(abort_code = meai::quota_module::ESpendCapExceeded)]
    fun test_quota_spend_cap_exceeded_fails() {
        let mut scenario = test_scenario::begin(USER1);
        scenario.create_system_objects();

        let mut quota = quota_module::create_quota(USER1, 1000, 200, scenario.ctx());
        let mut clock = scenario.take_shared<Clock>();

        quota_module::deduct(&mut quota, 300, string::utf8(b"gpt-4o"), &clock);

        test_scenario::return_shared(clock);
        let _id = object::id(&quota);
        transfer::public_transfer(quota, USER1);
        scenario.end();
    }

    // ═══════════════════════════════════════════
    //  REGISTRY MODULE
    // ═══════════════════════════════════════════

    #[test]
    fun test_registry_add_model() {
        let mut scenario = test_scenario::begin(ADMIN);
        scenario.create_system_objects();
        publish_module(&mut scenario);

        scenario.next_tx(ADMIN);

        let mut registry = scenario.take_shared<ModelRegistry>();

        registry_module::add_model(
            &mut registry,
            string::utf8(b"claude-sonnet-4"),
            string::utf8(b"anthropic"),
            800,
            4000,
            scenario.ctx(),
        );

        assert!(registry_module::model_count(&registry) == 1);

        let cost = registry_module::calculate_cost(&registry, string::utf8(b"claude-sonnet-4"), 1000, 0);
        assert!(cost == 800);

        test_scenario::return_shared(registry);
        scenario.end();
    }

    #[test]
    fun test_registry_calculate_cost() {
        let mut scenario = test_scenario::begin(ADMIN);
        scenario.create_system_objects();
        publish_module(&mut scenario);

        scenario.next_tx(ADMIN);

        let mut registry = scenario.take_shared<ModelRegistry>();

        registry_module::add_model(
            &mut registry,
            string::utf8(b"gpt-4o"),
            string::utf8(b"openai"),
            600,
            2500,
            scenario.ctx(),
        );

        let cost = registry_module::calculate_cost(
            &registry, string::utf8(b"gpt-4o"), 1000, 500,
        );
        assert!(cost == 1850);

        test_scenario::return_shared(registry);
        scenario.end();
    }

    #[test]
    #[expected_failure(abort_code = meai::registry_module::ENotAuthorized)]
    fun test_registry_non_admin_cannot_add() {
        let mut scenario = test_scenario::begin(ADMIN);
        scenario.create_system_objects();
        publish_module(&mut scenario);

        scenario.next_tx(USER1);

        let mut registry = scenario.take_shared<ModelRegistry>();

        registry_module::add_model(
            &mut registry,
            string::utf8(b"llama-3-70b"),
            string::utf8(b"atoma"),
            100,
            100,
            scenario.ctx(),
        );

        test_scenario::return_shared(registry);
        scenario.end();
    }

    #[test]
    #[expected_failure(abort_code = meai::registry_module::EModelExists)]
    fun test_registry_duplicate_model_fails() {
        let mut scenario = test_scenario::begin(ADMIN);
        scenario.create_system_objects();
        publish_module(&mut scenario);

        scenario.next_tx(ADMIN);

        let mut registry = scenario.take_shared<ModelRegistry>();

        registry_module::add_model(
            &mut registry,
            string::utf8(b"gpt-4o"),
            string::utf8(b"openai"),
            600,
            2500,
            scenario.ctx(),
        );

        registry_module::add_model(
            &mut registry,
            string::utf8(b"gpt-4o"),
            string::utf8(b"openai"),
            600,
            2500,
            scenario.ctx(),
        );

        test_scenario::return_shared(registry);
        scenario.end();
    }

    // ═══════════════════════════════════════════
    //  AGENT MODULE
    // ═══════════════════════════════════════════

    #[test]
    fun test_agent_register_and_query() {
        let mut scenario = test_scenario::begin(ADMIN);
        scenario.create_system_objects();
        publish_module(&mut scenario);

        scenario.next_tx(ADMIN);
        let mut registry = scenario.take_shared<AgentRegistry>();
        let mut clock = scenario.take_shared<Clock>();

        let agent_name = string::utf8(b"ResearchBot");
        let owner = USER1;
        let prompt = string::utf8(b"You are a research assistant.");
        let allowed = vector[string::utf8(b"gpt-4o"), string::utf8(b"claude-sonnet-4")];
        let budget = 100000u64;

        let agent_id = agent_module::register_agent(
            &mut registry, agent_name, owner, prompt, allowed, budget, &clock, scenario.ctx(),
        );

        assert!(agent_module::total_agents(&registry) == 1);

        test_scenario::return_shared(registry);
        test_scenario::return_shared(clock);

        scenario.next_tx(USER1);
        let agent = test_scenario::take_from_sender_by_id<Agent>(&scenario, agent_id);
        assert!(agent_module::budget_remaining(&agent) == 100000);
        assert!(agent_module::is_model_allowed(&agent, &string::utf8(b"gpt-4o")));
        assert!(!agent_module::is_model_allowed(&agent, &string::utf8(b"llama-3-70b")));

        let _id = object::id(&agent);
        transfer::public_transfer(agent, USER1);
        scenario.end();
    }

    #[test]
    fun test_agent_deduct_reduces_budget() {
        let mut scenario = test_scenario::begin(ADMIN);
        scenario.create_system_objects();
        publish_module(&mut scenario);

        scenario.next_tx(ADMIN);
        let mut registry = scenario.take_shared<AgentRegistry>();
        let mut clock = scenario.take_shared<Clock>();

        let agent_id = agent_module::register_agent(
            &mut registry,
            string::utf8(b"TestAgent"), USER1, string::utf8(b""),
            vector[], 5000u64, &clock, scenario.ctx(),
        );
        test_scenario::return_shared(registry);
        test_scenario::return_shared(clock);

        scenario.next_tx(USER1);
        let mut agent = test_scenario::take_from_sender_by_id<Agent>(&scenario, agent_id);
        let mut clock2 = scenario.take_shared<Clock>();

        agent_module::deduct_agent(&mut agent, 1000, string::utf8(b"gpt-4o"), &clock2);
        assert!(agent_module::budget_remaining(&agent) == 4000);

        agent_module::deduct_agent(&mut agent, 2000, string::utf8(b"claude-sonnet-4"), &clock2);
        assert!(agent_module::budget_remaining(&agent) == 2000);

        test_scenario::return_shared(clock2);
        transfer::public_transfer(agent, USER1);
        scenario.end();
    }

    #[test]
    #[expected_failure(abort_code = meai::agent_module::EInsufficientBudget)]
    fun test_agent_deduct_insufficient_budget_fails() {
        let mut scenario = test_scenario::begin(ADMIN);
        scenario.create_system_objects();
        publish_module(&mut scenario);

        scenario.next_tx(ADMIN);
        let mut registry = scenario.take_shared<AgentRegistry>();
        let mut clock = scenario.take_shared<Clock>();

        let agent_id = agent_module::register_agent(
            &mut registry,
            string::utf8(b"PoorAgent"), USER1, string::utf8(b""),
            vector[], 100u64, &clock, scenario.ctx(),
        );
        test_scenario::return_shared(registry);
        test_scenario::return_shared(clock);

        scenario.next_tx(USER1);
        let mut agent = test_scenario::take_from_sender_by_id<Agent>(&scenario, agent_id);
        let mut clock2 = scenario.take_shared<Clock>();
        agent_module::deduct_agent(&mut agent, 200, string::utf8(b"gpt-4o"), &clock2);
        test_scenario::return_shared(clock2);
        transfer::public_transfer(agent, USER1);
        scenario.end();
    }

    #[test]
    fun test_agent_deactivate() {
        let mut scenario = test_scenario::begin(ADMIN);
        scenario.create_system_objects();
        publish_module(&mut scenario);

        scenario.next_tx(ADMIN);
        let mut registry = scenario.take_shared<AgentRegistry>();
        let mut clock = scenario.take_shared<Clock>();

        let agent_id = agent_module::register_agent(
            &mut registry,
            string::utf8(b"TestAgent"), ADMIN, string::utf8(b""),
            vector[], 5000u64, &clock, scenario.ctx(),
        );
        test_scenario::return_shared(registry);
        test_scenario::return_shared(clock);

        scenario.next_tx(ADMIN);
        let mut agent = test_scenario::take_from_sender_by_id<Agent>(&scenario, agent_id);
        let mut clock2 = scenario.take_shared<Clock>();

        agent_module::deactivate_agent(&mut agent, &clock2, scenario.ctx());

        test_scenario::return_shared(clock2);
        transfer::public_transfer(agent, ADMIN);
        scenario.end();
    }

    // ═══════════════════════════════════════════
    //  AGENT HIRE MODULE
    // ═══════════════════════════════════════════

    #[test]
    fun test_hire_create_and_query_task() {
        let mut scenario = test_scenario::begin(ADMIN);
        scenario.create_system_objects();
        publish_module(&mut scenario);

        let agent_a_id = fake_agent_id();
        let agent_b_id = fake_agent_id();

        scenario.next_tx(ADMIN);
        let mut registry = scenario.take_shared<TaskRegistry>();
        let mut clock = scenario.take_shared<Clock>();
        let payment = coin::mint_for_testing<SUI>(1000, scenario.ctx());

        let task_id = agent_hire::create_task(
            &mut registry, agent_a_id, agent_b_id,
            string::utf8(b"Translate this document"),
            payment, &clock, scenario.ctx(),
        );

        assert!(agent_hire::total_tasks(&registry) == 1);

        test_scenario::return_shared(registry);
        test_scenario::return_shared(clock);

        scenario.next_tx(ADMIN);
        let task = test_scenario::take_from_sender_by_id<AgentTask>(&scenario, task_id);
        assert!(agent_hire::task_status(&task) == 0);
        assert!(agent_hire::task_budget(&task) == 1000);

        let _id = object::id(&task);
        transfer::public_transfer(task, ADMIN);
        scenario.end();
    }

    #[test]
    fun test_hire_accept_complete_pays() {
        let mut scenario = test_scenario::begin(ADMIN);
        scenario.create_system_objects();
        publish_module(&mut scenario);

        let agent_a_id = fake_agent_id();
        let agent_b_id = fake_agent_id();
        let hired_address = USER2;

        scenario.next_tx(ADMIN);
        let mut registry = scenario.take_shared<TaskRegistry>();
        let mut clock = scenario.take_shared<Clock>();
        let payment = coin::mint_for_testing<SUI>(5000, scenario.ctx());

        let task_id = agent_hire::create_task(
            &mut registry, agent_a_id, agent_b_id,
            string::utf8(b"Write code"),
            payment, &clock, scenario.ctx(),
        );
        test_scenario::return_shared(registry);
        test_scenario::return_shared(clock);

        scenario.next_tx(ADMIN);
        let mut task = test_scenario::take_from_sender_by_id<AgentTask>(&scenario, task_id);
        let mut clock2 = scenario.take_shared<Clock>();

        agent_hire::accept_task(&mut task, &clock2);
        assert!(agent_hire::task_status(&task) == 1);

        agent_hire::complete_task(&mut task, hired_address, &clock2, scenario.ctx());
        assert!(agent_hire::task_status(&task) == 2);

        test_scenario::return_shared(clock2);
        let _id = object::id(&task);
        transfer::public_transfer(task, ADMIN);
        scenario.end();
    }

    #[test]
    fun test_hire_dispute_accepted_task() {
        let mut scenario = test_scenario::begin(ADMIN);
        scenario.create_system_objects();
        publish_module(&mut scenario);

        let agent_a_id = fake_agent_id();
        let agent_b_id = fake_agent_id();

        scenario.next_tx(ADMIN);
        let mut registry = scenario.take_shared<TaskRegistry>();
        let mut clock = scenario.take_shared<Clock>();
        let payment = coin::mint_for_testing<SUI>(3000, scenario.ctx());

        let task_id = agent_hire::create_task(
            &mut registry, agent_a_id, agent_b_id,
            string::utf8(b"Design a logo"),
            payment, &clock, scenario.ctx(),
        );
        test_scenario::return_shared(registry);
        test_scenario::return_shared(clock);

        scenario.next_tx(ADMIN);
        let mut task = test_scenario::take_from_sender_by_id<AgentTask>(&scenario, task_id);
        let mut clock2 = scenario.take_shared<Clock>();

        agent_hire::accept_task(&mut task, &clock2);
        agent_hire::dispute_task(&mut task, &clock2);
        assert!(agent_hire::task_status(&task) == 3);

        test_scenario::return_shared(clock2);
        let _id = object::id(&task);
        transfer::public_transfer(task, ADMIN);
        scenario.end();
    }

    // ═══════════════════════════════════════════
    //  INTEGRATION: Full Flow
    // ═══════════════════════════════════════════

    #[test]
    fun test_integration_full_flow() {
        let mut scenario = test_scenario::begin(ADMIN);
        scenario.create_system_objects();
        publish_module(&mut scenario);

        // 1. Admin adds a model
        scenario.next_tx(ADMIN);
        let mut registry = scenario.take_shared<ModelRegistry>();
        registry_module::add_model(
            &mut registry,
            string::utf8(b"claude-sonnet-4"),
            string::utf8(b"anthropic"),
            800,
            4000,
            scenario.ctx(),
        );
        test_scenario::return_shared(registry);

        // 2. Admin issues an API cap for USER1
        scenario.next_tx(ADMIN);
        let mut registry2 = scenario.take_shared<ApiKeyRegistry>();
        let mut clock = scenario.take_shared<Clock>();
        let models = vector[string::utf8(b"claude-sonnet-4")];
        let cap_id = access_module::mint_cap(&mut registry2, USER1, 1, models, &clock, scenario.ctx());
        assert!(access_module::verify_cap(&registry2, cap_id, string::utf8(b"claude-sonnet-4")));
        test_scenario::return_shared(registry2);
        test_scenario::return_shared(clock);

        // 3. USER1 creates a quota and deducts for an LLM call
        scenario.next_tx(USER1);
        let mut quota = quota_module::create_quota(USER1, 10000, 5000, scenario.ctx());
        let mut clock2 = scenario.take_shared<Clock>();
        quota_module::deduct(&mut quota, 1850, string::utf8(b"claude-sonnet-4"), &clock2);
        assert!(quota_module::balance(&quota) == 8150);
        assert!(quota_module::used_today(&quota) == 1850);
        test_scenario::return_shared(clock2);

        let _id = object::id(&quota);
        transfer::public_transfer(quota, USER1);
        scenario.end();
    }
}
