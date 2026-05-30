module meai::agent_hire {
    use sui::event;
    use sui::clock::{Self, Clock};
    use sui::coin::{Self, Coin};
    use sui::sui::SUI;
    use sui::balance::{Self, Balance};
    use std::string::String;

    const STATUS_PENDING: u8 = 0;
    const STATUS_ACCEPTED: u8 = 1;
    const STATUS_COMPLETED: u8 = 2;
    const STATUS_DISPUTED: u8 = 3;

    public struct AgentTask has key, store {
        id: UID,
        hirer_agent_id: ID,
        hired_agent_id: ID,
        task_description: String,
        escrow: Balance<SUI>,
        status: u8,
        created_at: u64,
        completed_at: u64,
    }

    public struct TaskRegistry has key {
        id: UID,
        total_tasks: u64,
    }

    public struct TaskCreated has copy, drop {
        task_id: ID,
        hirer_agent_id: ID,
        description: String,
        budget: u64,
        timestamp: u64,
    }

    public struct TaskAccepted has copy, drop {
        task_id: ID,
        hired_agent_id: ID,
        timestamp: u64,
    }

    public struct TaskCompleted has copy, drop {
        task_id: ID,
        hired_agent_id: ID,
        amount: u64,
        timestamp: u64,
    }

    public struct TaskDisputed has copy, drop {
        task_id: ID,
        timestamp: u64,
    }

    const EInsufficientPayment: u64 = 1;
    const ETaskNotPending: u64 = 2;
    const ETaskNotAccepted: u64 = 3;
    fun init(ctx: &mut TxContext) {
        transfer::share_object(TaskRegistry {
            id: object::new(ctx),
            total_tasks: 0,
        });
    }

    public fun create_task(
        registry: &mut TaskRegistry,
        hirer_agent_id: ID,
        hired_agent_id: ID,
        task_description: String,
        payment: Coin<SUI>,
        clock: &Clock,
        ctx: &mut TxContext,
    ): ID {
        let budget = coin::value(&payment);
        assert!(budget > 0, EInsufficientPayment);

        let escrow = coin::into_balance(payment);

        let task = AgentTask {
            id: object::new(ctx),
            hirer_agent_id,
            hired_agent_id,
            task_description,
            escrow,
            status: STATUS_PENDING,
            created_at: clock::timestamp_ms(clock),
            completed_at: 0,
        };

        let task_id = object::id(&task);
        transfer::transfer(task, tx_context::sender(ctx));

        registry.total_tasks = registry.total_tasks + 1;

        event::emit(TaskCreated {
            task_id,
            hirer_agent_id,
            description: task_description,
            budget,
            timestamp: clock::timestamp_ms(clock),
        });

        task_id
    }

    public fun accept_task(
        task: &mut AgentTask,
        clock: &Clock,
    ) {
        assert!(task.status == STATUS_PENDING, ETaskNotPending);
        task.status = STATUS_ACCEPTED;

        event::emit(TaskAccepted {
            task_id: object::id(task),
            hired_agent_id: task.hired_agent_id,
            timestamp: clock::timestamp_ms(clock),
        });
    }

    public fun complete_task(
        task: &mut AgentTask,
        hired_address: address,
        clock: &Clock,
        ctx: &mut TxContext,
    ) {
        assert!(task.status == STATUS_ACCEPTED, ETaskNotAccepted);

        task.status = STATUS_COMPLETED;
        task.completed_at = clock::timestamp_ms(clock);

        let amount = balance::value(&task.escrow);
        let payout = coin::take(&mut task.escrow, amount, ctx);
        transfer::public_transfer(payout, hired_address);

        event::emit(TaskCompleted {
            task_id: object::id(task),
            hired_agent_id: task.hired_agent_id,
            amount,
            timestamp: clock::timestamp_ms(clock),
        });
    }

    public fun dispute_task(
        task: &mut AgentTask,
        clock: &Clock,
    ) {
        assert!(task.status == STATUS_ACCEPTED, ETaskNotAccepted);
        task.status = STATUS_DISPUTED;

        event::emit(TaskDisputed {
            task_id: object::id(task),
            timestamp: clock::timestamp_ms(clock),
        });
    }

    public fun task_status(task: &AgentTask): u8 {
        task.status
    }

    public fun task_budget(task: &AgentTask): u64 {
        balance::value(&task.escrow)
    }

    public fun total_tasks(registry: &TaskRegistry): u64 {
        registry.total_tasks
    }

    #[test_only]
    public fun create_registry_for_testing(ctx: &mut TxContext) {
        init(ctx);
    }
}
