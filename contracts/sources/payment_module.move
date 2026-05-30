module meai::payment_module {
    use sui::event;
    use sui::table::{Self, Table};
    use sui::coin::{Self, Coin};
    use sui::sui::SUI;
    use sui::balance::{Self, Balance};
    use sui::clock::{Self, Clock};

    public struct Treasury has key {
        id: UID,
        total_deposits: Balance<SUI>,
        platform_fee_bps: u16,
    }

    public struct ProviderShare has store {
        provider: address,
        share_bps: u16,
    }

    public struct RevenueConfig has key {
        id: UID,
        providers: Table<address, ProviderShare>,
        platform_bps: u16,
    }

    public struct Deposited has copy, drop {
        user: address,
        amount: u64,
        timestamp: u64,
    }

    public struct Withdrawn has copy, drop {
        recipient: address,
        amount: u64,
        timestamp: u64,
    }

    const ENotAuthorized: u64 = 1;
    const EInvalidFee: u64 = 2;

    fun init(ctx: &mut TxContext) {
        transfer::share_object(Treasury {
            id: object::new(ctx),
            total_deposits: balance::zero(),
            platform_fee_bps: 1500,
        });
    }

    public fun deposit(
        treasury: &mut Treasury,
        payment: Coin<SUI>,
        clock: &Clock,
        ctx: &mut TxContext,
    ) {
        let amount = coin::value(&payment);
        balance::join(&mut treasury.total_deposits, coin::into_balance(payment));

        event::emit(Deposited {
            user: tx_context::sender(ctx),
            amount,
            timestamp: clock::timestamp_ms(clock),
        });
    }

    public fun withdraw(
        treasury: &mut Treasury,
        amount: u64,
        ctx: &mut TxContext,
    ): Coin<SUI> {
        let withdraw_amount = balance::split(&mut treasury.total_deposits, amount);
        coin::from_balance(withdraw_amount, ctx)
    }

    public fun configure_revenue(
        providers: vector<address>,
        shares: vector<u16>,
        ctx: &mut TxContext,
    ): RevenueConfig {
        let len = vector::length(&providers);
        let mut t = table::new(ctx);
        let mut total: u64 = 0;
        let mut i = 0;

        while (i < len) {
            let wallet = *vector::borrow(&providers, i);
            let share = *vector::borrow(&shares, i);
            total = total + (share as u64);
            table::add(&mut t, wallet, ProviderShare { provider: wallet, share_bps: share });
            i = i + 1;
        };

        assert!(total <= 10000, EInvalidFee);

        RevenueConfig {
            id: object::new(ctx),
            providers: t,
            platform_bps: 1500,
        }
    }

    public fun set_platform_fee(
        treasury: &mut Treasury,
        new_fee_bps: u16,
        ctx: &TxContext,
    ) {
        assert!(tx_context::sender(ctx) == @meai, ENotAuthorized);
        assert!(new_fee_bps <= 3000, EInvalidFee);
        treasury.platform_fee_bps = new_fee_bps;
    }

    public fun balance(treasury: &Treasury): u64 {
        balance::value(&treasury.total_deposits)
    }

    #[test_only]
    public fun create_treasury_for_testing(ctx: &mut TxContext) {
        transfer::share_object(Treasury {
            id: object::new(ctx),
            total_deposits: balance::zero(),
            platform_fee_bps: 1500,
        })
    }
}
