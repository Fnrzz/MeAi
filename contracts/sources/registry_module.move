module meai::registry_module {
    use sui::event;
    use sui::table::{Self, Table};
    use std::string::String;

    public struct ModelInfo has store {
        model_id: String,
        provider: String,
        input_price_per_1k: u64,
        output_price_per_1k: u64,
        is_active: bool,
    }

    public struct ModelRegistry has key {
        id: UID,
        models: Table<String, ModelInfo>,
        total_models: u64,
    }

    public struct ModelAdded has copy, drop {
        model_id: String,
        provider: String,
        input_price: u64,
        output_price: u64,
    }

    public struct ModelUpdated has copy, drop {
        model_id: String,
        input_price: u64,
        output_price: u64,
    }

    const ENotAuthorized: u64 = 1;
    const EModelExists: u64 = 2;

    fun init(ctx: &mut TxContext) {
        transfer::share_object(ModelRegistry {
            id: object::new(ctx),
            models: table::new(ctx),
            total_models: 0,
        });
    }

    public fun add_model(
        registry: &mut ModelRegistry,
        model_id: String,
        provider: String,
        input_price: u64,
        output_price: u64,
        ctx: &TxContext,
    ) {
        assert!(tx_context::sender(ctx) == @meai, ENotAuthorized);
        assert!(!table::contains(&registry.models, model_id), EModelExists);

        table::add(&mut registry.models, model_id, ModelInfo {
            model_id,
            provider,
            input_price_per_1k: input_price,
            output_price_per_1k: output_price,
            is_active: true,
        });
        registry.total_models = registry.total_models + 1;
    }

    public fun update_model_pricing(
        registry: &mut ModelRegistry,
        model_id: String,
        new_input_price: u64,
        new_output_price: u64,
        ctx: &TxContext,
    ) {
        assert!(tx_context::sender(ctx) == @meai, ENotAuthorized);
        let model = table::borrow_mut(&mut registry.models, model_id);
        model.input_price_per_1k = new_input_price;
        model.output_price_per_1k = new_output_price;

        event::emit(ModelUpdated {
            model_id,
            input_price: new_input_price,
            output_price: new_output_price,
        });
    }

    public fun get_model(registry: &ModelRegistry, model_id: String): &ModelInfo {
        table::borrow(&registry.models, model_id)
    }

    public fun model_count(registry: &ModelRegistry): u64 {
        registry.total_models
    }

    #[test_only]
    public fun create_registry_for_testing(ctx: &mut TxContext) {
        transfer::share_object(ModelRegistry {
            id: object::new(ctx),
            models: table::new(ctx),
            total_models: 0,
        })
    }

    public fun calculate_cost(
        registry: &ModelRegistry,
        model_id: String,
        input_tokens: u64,
        output_tokens: u64,
    ): u64 {
        let model = table::borrow(&registry.models, model_id);
        let input_cost = input_tokens * model.input_price_per_1k / 1000;
        let output_cost = output_tokens * model.output_price_per_1k / 1000;
        input_cost + output_cost
    }
}
