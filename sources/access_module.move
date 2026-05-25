module meai::access_module {
    use sui::event;
    use sui::table::{Self, Table};
    use sui::clock::{Self, Clock};
    use std::string::String;

    public struct ApiCapObject has key, store {
        id: UID,
        owner: address,
        tier: u8,
        allowed_models: Table<String, bool>,
        issued_at: u64,
        is_active: bool,
    }

    public struct ApiKeyRegistry has key {
        id: UID,
        caps: Table<ID, ApiCapObject>,
        total_issued: u64,
    }

    public struct CapMinted has copy, drop {
        cap_id: ID,
        owner: address,
        tier: u8,
        timestamp: u64,
    }

    public struct CapRevoked has copy, drop {
        cap_id: ID,
        timestamp: u64,
    }

    public struct CapTransferred has copy, drop {
        cap_id: ID,
        from: address,
        to: address,
        timestamp: u64,
    }

    const ENotOwner: u64 = 1;

    fun init(ctx: &mut TxContext) {
        transfer::share_object(ApiKeyRegistry {
            id: object::new(ctx),
            caps: table::new(ctx),
            total_issued: 0,
        });
    }

    public fun mint_cap(
        registry: &mut ApiKeyRegistry,
        owner: address,
        tier: u8,
        allowed_models: vector<String>,
        clock: &Clock,
        ctx: &mut TxContext,
    ): ID {
        let mut models = table::new(ctx);
        let mut i = 0;
        while (i < vector::length(&allowed_models)) {
            let model = *vector::borrow(&allowed_models, i);
            table::add(&mut models, model, true);
            i = i + 1;
        };

        let cap = ApiCapObject {
            id: object::new(ctx),
            owner,
            tier,
            allowed_models: models,
            issued_at: clock::timestamp_ms(clock),
            is_active: true,
        };

        let cap_id = object::id(&cap);
        table::add(&mut registry.caps, cap_id, cap);
        registry.total_issued = registry.total_issued + 1;

        event::emit(CapMinted {
            cap_id,
            owner,
            tier,
            timestamp: clock::timestamp_ms(clock),
        });

        cap_id
    }

    public fun revoke_cap(
        registry: &mut ApiKeyRegistry,
        cap_id: ID,
        clock: &Clock,
        ctx: &TxContext,
    ) {
        let cap = table::borrow_mut(&mut registry.caps, cap_id);
        assert!(cap.owner == tx_context::sender(ctx) || tx_context::sender(ctx) == @meai, ENotOwner);
        cap.is_active = false;

        event::emit(CapRevoked {
            cap_id,
            timestamp: clock::timestamp_ms(clock),
        });
    }

    public fun transfer_cap(
        registry: &mut ApiKeyRegistry,
        cap_id: ID,
        new_owner: address,
        clock: &Clock,
        ctx: &TxContext,
    ) {
        let cap = table::borrow_mut(&mut registry.caps, cap_id);
        assert!(cap.owner == tx_context::sender(ctx), ENotOwner);
        let old_owner = cap.owner;
        cap.owner = new_owner;

        event::emit(CapTransferred {
            cap_id,
            from: old_owner,
            to: new_owner,
            timestamp: clock::timestamp_ms(clock),
        });
    }

    public fun verify_cap(
        registry: &ApiKeyRegistry,
        cap_id: ID,
        model: String,
    ): bool {
        if (!table::contains(&registry.caps, cap_id)) return false;
        let cap = table::borrow(&registry.caps, cap_id);
        cap.is_active && table::contains(&cap.allowed_models, model)
    }

    public fun cap_owner(registry: &ApiKeyRegistry, cap_id: ID): address {
        let cap = table::borrow(&registry.caps, cap_id);
        cap.owner
    }

    public fun total_issued(registry: &ApiKeyRegistry): u64 {
        registry.total_issued
    }

    #[test_only]
    public fun create_registry_for_testing(ctx: &mut TxContext) {
        transfer::share_object(ApiKeyRegistry {
            id: object::new(ctx),
            caps: table::new(ctx),
            total_issued: 0,
        })
    }
}
