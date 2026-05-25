module meai::quota_module {
    use sui::event;
    use sui::coin::{Self, Coin};
    use sui::sui::SUI;
    use sui::clock::{Self, Clock};
    use std::string::String;

    public struct QuotaObject has key, store {
        id: UID,
        owner: address,
        token_balance: u64,
        spend_cap_per_day: u64,
        used_today: u64,
        last_reset_epoch: u64,
        total_used: u64,
    }

    public struct SpendCapObject has key, store {
        id: UID,
        owner: address,
        max_spend_per_day: u64,
        agent_address: address,
    }

    public struct QuotaToppedUp has copy, drop {
        quota_id: ID,
        amount: u64,
        new_balance: u64,
        timestamp: u64,
    }

    public struct TokensDeducted has copy, drop {
        quota_id: ID,
        amount: u64,
        model: String,
        timestamp: u64,
    }

    public struct SpendCapUpdated has copy, drop {
        cap_id: ID,
        new_limit: u64,
        timestamp: u64,
    }

    const EInsufficientBalance: u64 = 1;
    const ENotOwner: u64 = 2;
    const ESpendCapExceeded: u64 = 3;

    public fun create_quota(
        owner: address,
        initial_tokens: u64,
        spend_cap: u64,
        ctx: &mut TxContext,
    ): QuotaObject {
        QuotaObject {
            id: object::new(ctx),
            owner,
            token_balance: initial_tokens,
            spend_cap_per_day: spend_cap,
            used_today: 0,
            last_reset_epoch: 0,
            total_used: 0,
        }
    }

    public fun topup(
        quota: &mut QuotaObject,
        payment: Coin<SUI>,
        rate: u64,
        clock: &Clock,
        ctx: &TxContext,
    ) {
        assert!(quota.owner == tx_context::sender(ctx), ENotOwner);
        let sui_amount = coin::value(&payment);
        let tokens = sui_amount * rate;
        quota.token_balance = quota.token_balance + tokens;

        transfer::public_transfer(payment, tx_context::sender(ctx));

        event::emit(QuotaToppedUp {
            quota_id: object::id(quota),
            amount: tokens,
            new_balance: quota.token_balance,
            timestamp: clock::timestamp_ms(clock),
        });
    }

    public fun deduct(
        quota: &mut QuotaObject,
        amount: u64,
        model: String,
        clock: &Clock,
    ) {
        let epoch = clock::timestamp_ms(clock) / 86400000;
        if (epoch != quota.last_reset_epoch) {
            quota.used_today = 0;
            quota.last_reset_epoch = epoch;
        };

        assert!(quota.token_balance >= amount, EInsufficientBalance);
        assert!(quota.used_today + amount <= quota.spend_cap_per_day, ESpendCapExceeded);

        quota.token_balance = quota.token_balance - amount;
        quota.used_today = quota.used_today + amount;
        quota.total_used = quota.total_used + amount;

        event::emit(TokensDeducted {
            quota_id: object::id(quota),
            amount,
            model,
            timestamp: clock::timestamp_ms(clock),
        });
    }

    public fun create_spend_cap(
        owner: address,
        max_spend: u64,
        agent: address,
        ctx: &mut TxContext,
    ): SpendCapObject {
        SpendCapObject {
            id: object::new(ctx),
            owner,
            max_spend_per_day: max_spend,
            agent_address: agent,
        }
    }

    public fun update_spend_cap(
        cap: &mut SpendCapObject,
        new_max: u64,
        clock: &Clock,
        ctx: &TxContext,
    ) {
        assert!(cap.owner == tx_context::sender(ctx), ENotOwner);
        cap.max_spend_per_day = new_max;

        event::emit(SpendCapUpdated {
            cap_id: object::id(cap),
            new_limit: new_max,
            timestamp: clock::timestamp_ms(clock),
        });
    }

    public fun balance(quota: &QuotaObject): u64 {
        quota.token_balance
    }

    public fun used_today(quota: &QuotaObject): u64 {
        quota.used_today
    }
}
