use anchor_lang::prelude::*;
use anchor_spl::associated_token::AssociatedToken;
use anchor_spl::token::{self, Token, TokenAccount, Transfer};

use crate::events::AiNftMinted;
use crate::state::{AINFTCollection, AiCharacterNFT, AiNft};

#[derive(Accounts)]
#[instruction(nft_mint: Pubkey)]
pub struct PurchasePremintedNft<'info> {
    #[account(
        mut,
        seeds = ["app_ainft".as_bytes()],
        bump,
    )]
    pub ai_nft: Box<Account<'info, AiNft>>,

    #[account(
        mut,
        seeds = [
            "ainft".as_bytes(), 
            nft_mint.key().as_ref(),
        ],
        bump,
        constraint = ai_character.load()?.is_preminted == true,
        constraint = ai_character.load()?.is_minted == false,
    )]
    pub ai_character: AccountLoader<'info, AiCharacterNFT>,

    #[account(
        mut,
        constraint = collection.key() == ai_character.load()?.collection,
    )]
    pub collection: Account<'info, AINFTCollection>,

    // The NFT mint that was preminted
    #[account(
        mut,
        address = nft_mint,
    )]
    pub nft_mint: Account<'info, anchor_spl::token::Mint>,

    // Collection's token account that currently holds the NFT
    #[account(
        mut,
        associated_token::mint = nft_mint,
        associated_token::authority = collection,
    )]
    pub collection_token_account: Box<Account<'info, TokenAccount>>,

    // User's token account to receive the NFT
    #[account(
        init_if_needed,
        payer = buyer,
        associated_token::mint = nft_mint,
        associated_token::authority = buyer,
    )]
    pub buyer_token_account: Box<Account<'info, TokenAccount>>,

    // The buyer who is purchasing the NFT
    #[account(mut)]
    pub buyer: Signer<'info>,

    // Collection authority to receive payment
    /// CHECK: This is the collection authority that receives payment
    #[account(
        mut,
        address = collection.authority,
    )]
    pub collection_authority: UncheckedAccount<'info>,

    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub rent: Sysvar<'info, Rent>,
}

impl<'info> PurchasePremintedNft<'info> {
    pub fn transfer_nft_ctx(&self) -> CpiContext<'_, '_, '_, 'info, Transfer<'info>> {
        let program = self.token_program.to_account_info();
        let accounts = Transfer {
            from: self.collection_token_account.to_account_info(),
            to: self.buyer_token_account.to_account_info(),
            authority: self.collection.to_account_info(),
        };
        CpiContext::new(program, accounts)
    }
}

pub fn purchase_preminted_nft_handler(
    ctx: Context<PurchasePremintedNft>,
    nft_mint: Pubkey,
) -> Result<()> {
    // Get the price of the NFT
    let price = {
        let ai_character = ctx.accounts.ai_character.load()?;
        ai_character.mint_price
    };

    // Transfer SOL from buyer to collection authority
    anchor_lang::system_program::transfer(
        CpiContext::new(
            ctx.accounts.system_program.to_account_info(),
            anchor_lang::system_program::Transfer {
                from: ctx.accounts.buyer.to_account_info(),
                to: ctx.accounts.collection_authority.to_account_info(),
            },
        ),
        price,
    )?;

    // Transfer NFT from collection to buyer
    let collection_seeds = &[
        "collection".as_bytes(),
        ctx.accounts.collection.authority.as_ref(),
        ctx.accounts.collection.name.as_ref(),
        &ctx.accounts.collection.bump,
    ];

    token::transfer(
        ctx.accounts
            .transfer_nft_ctx()
            .with_signer(&[collection_seeds]),
        1,
    )?;

    // Update the AiCharacterNFT to mark it as minted
    {
        let mut ai_character = ctx.accounts.ai_character.load_mut()?;
        ai_character.set_minted(true);
    }

    // Emit an event for the minted NFT
    emit!(AiNftMinted {
        ai_nft: ctx.accounts.ai_character.key(),
        collection: ctx.accounts.collection.key(),
        owner: ctx.accounts.buyer.key(),
    });

    Ok(())
}
