import * as anchor from "@coral-xyz/anchor";
import { BN, Program } from "@coral-xyz/anchor";
import { Ainft } from "../target/types/ainft";
import { LAMPORTS_PER_SOL, PublicKey, Signer, SystemProgram, SYSVAR_RENT_PUBKEY, Transaction } from "@solana/web3.js";
import { TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID } from "@solana/spl-token";
import * as spl from "@solana/spl-token"
import { assert } from "chai";
import { findMasterMintPDA, findAppAinftPDA, findComputeMintPDA, findMetadataPDA, findAiCharacterMintPDA, findAiCharacterPDA } from "../sdk-ts/src/utils";

const METADATA_PROGRAM_ID = new PublicKey("metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s");

interface Config {
  name: string;
  clients: string[];
  model_provider: string;
  settings: {
    voice: {
      model: string;
    };
  };
  bio: string[];
  lore: string[];
  knowledge: string[];
  topics: string[];
  style: any;
  adjectives: string[];
}

describe("ainft", async () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.Ainft as Program<Ainft>;

  let [appAinftPda] = findAppAinftPDA();
  let [masterMint] = findMasterMintPDA();
  let [computeMint] = findComputeMintPDA();
  let [masterMetadata] = findMetadataPDA(masterMint);
  var payer = anchor.web3.Keypair.generate();
  var masterToken = await anchor.utils.token.associatedAddress({
    mint: masterMint,
    owner: payer.publicKey
  });

  // Create an external token mint outside of the program
  let stakerComputeAccount: PublicKey;
  const mintAmount = 200_000_000_000;

  beforeEach(async function () {
    // Setup payer and airdrop
    const signature = await provider.connection.requestAirdrop(
      payer.publicKey,
      20 * anchor.web3.LAMPORTS_PER_SOL
    );
    await provider.connection.confirmTransaction(signature);

    // Create the AI NFT collection
    const defaultExecutionClient = anchor.web3.Keypair.generate().publicKey;
    const createAiNftParams = {
      name: "AI Agent Collection",
      uri: "https://example.com/metadata.json",
      symbol: "AIA",
      defaultExecutionClient: defaultExecutionClient,
      mintPrice: new BN(100),
      maxSupply: new BN(100),
      computeMint: PublicKey.default, // Set to default for external mint
    };
    console.log("defaultExecutionClient", defaultExecutionClient.toBase58());
    await program.methods
      .createAppAinft(createAiNftParams)
      .accounts({
        aiNft: appAinftPda,
        masterMint: masterMint,
        masterToken: masterToken,
        masterMetadata: masterMetadata,
        payer: payer.publicKey,
      })
      .signers([payer])
      .rpc();
    console.log("ok")
    // Verify the collection was created correctly
    var ainftAccount = await program.account.aiNft.fetch(appAinftPda);
    console.log("ainftAccount", ainftAccount);
    assert.ok(ainftAccount.authority.equals(payer.publicKey), "Authority mismatch");
    assert.ok(ainftAccount.masterMint.toBase58() === masterMint.toBase58(), "Master mint mismatch");
    assert.ok(ainftAccount.computeMint.equals(PublicKey.default), "Compute mint should be default");
    assert.equal(ainftAccount.mintCount.toString(), "0", "Mint count should be 0");

    // Create an external token mint outside of the program
    console.log("Creating external token mint");
    var externalComputeMint = await spl.createMint(
      provider.connection,
      payer,
      payer.publicKey,  // mint authority
      null,  // freeze authority (optional)
      9,  // decimals (same as in the program),
    );
    console.log("External token mint created:", externalComputeMint.toBase58());

    // Create a token account for the payer
    const payerTokenAccount = await spl.getOrCreateAssociatedTokenAccount(
      provider.connection,
      payer,
      externalComputeMint,
      payer.publicKey
    );
    stakerComputeAccount = payerTokenAccount.address;

    console.log("Minting external tokens");
    await spl.mintTo(
      provider.connection,
      payer,
      externalComputeMint,
      payerTokenAccount.address,
      payer,
      mintAmount,
      [payer],
    );

    // Verify the tokens were minted
    const payerTokenBalance = await provider.connection.getTokenAccountBalance(stakerComputeAccount);
    assert.equal(payerTokenBalance.value.amount, mintAmount.toString(), "Payer should have the minted tokens");

    // Set the external token as the compute token for the AI NFT
    console.log("Setting external token as compute token");
    await program.methods
      .setExternalComputeMint()
      .accounts({
        aiNft: appAinftPda,
        externalComputeMint: externalComputeMint,
        authority: payer.publicKey,
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
      })
      .signers([payer])
      .rpc();

    // Verify the compute mint was set correctly
    const updatedAinftAccount = await program.account.aiNft.fetch(appAinftPda);
    assert.ok(updatedAinftAccount.computeMint.equals(externalComputeMint), "Compute mint should be set to external token");
    computeMint = externalComputeMint; // Update the computeMint reference for the rest of the tests
  });

  it("Mints an AI NFT successfully", async () => {

    const aiCharacterName = "AI Character #1";
    const aiNftMetadata = {
      name: aiCharacterName,
      uri: "https://example.com/character1.json",
      characterConfig: {
        name: "Helpful Assistant",
        clients: ["default"],
        modelProvider: "openai",
        settings: {
          voice: {
            model: "eleven-labs"
          }
        },
        plugins: [],
        bio: ["AI programming assistant"],
        lore: ["Created to help developers write better code"],
        knowledge: ["Programming", "Software Development"],
        messageExamples: [
          [{
            user: "How can I help you?",
            content: {
              role: "assistant",
              content: "I'm here to help with programming!"
            }
          }]
        ],
        postExamples: ["Here's how to solve this coding problem..."],
        topics: ["Programming", "Technology"],
        style: {
          tone: "Professional",
          writing: "Technical"
        },
        adjectives: ["helpful", "knowledgeable", "patient"]
      }
    };

    const [aiCharacterMint] = findAiCharacterMintPDA(appAinftPda, aiCharacterName);
    const [aiCharacter] = findAiCharacterPDA(aiCharacterMint);
    const [aiCharacterMetadata] = findMetadataPDA(aiCharacterMint);

    const payerAiCharacterTokenAccount = await anchor.utils.token.associatedAddress({
      mint: aiCharacterMint,
      owner: payer.publicKey
    });

    console.log("payerAiCharacterTokenAccount", payerAiCharacterTokenAccount.toBase58());
    console.log("aiCharacterMint", aiCharacterMint.toBase58());
    console.log("aiCharacter", aiCharacter.toBase58());
    console.log("aiCharacterMetadata", aiCharacterMetadata.toBase58());
    console.log("appAinftPda", appAinftPda.toBase58());
    console.log("payer", payer.publicKey.toBase58());
    console.log("aiNft", appAinftPda.toBase58());
    console.log("metadataProgram", METADATA_PROGRAM_ID.toBase58());
    console.log("rent", SYSVAR_RENT_PUBKEY.toBase58());
    console.log("systemProgram", SystemProgram.programId.toBase58());
    console.log("tokenProgram", TOKEN_PROGRAM_ID.toBase58());
    console.log("associatedTokenProgram", ASSOCIATED_TOKEN_PROGRAM_ID.toBase58());

    var ainftAccount = await program.account.aiNft.fetch(appAinftPda);
    console.log("ainftAccount", ainftAccount);
    assert.equal(ainftAccount.mintCount.toString(), "0", "Mint count should be 0");
    assert.equal(ainftAccount.maxSupply.toString(), "100", "Max supply should be 100");
    // Mint the AI character
    console.log("Minting AI character");
    await program.methods
      .mintAinft(
        aiNftMetadata.name,
        aiNftMetadata.uri,
      )
      .accounts({
        payer: payer.publicKey,
        aiNft: appAinftPda,
        aiCharacter: aiCharacter,
        aiCharacterMint: aiCharacterMint,
        aiCharacterMetadata: aiCharacterMetadata,
        payerAiCharacterTokenAccount: payerAiCharacterTokenAccount,
      })
      .signers([payer])
      .rpc();

    // // Create compute token account for the AI character
    const aiCharacterComputeTokenAccount = await anchor.utils.token.associatedAddress({
      mint: computeMint,
      owner: aiCharacter
    });
    // create ai character compute account 
    console.log("Creating ai character compute account");
    console.log("aiCharacter", aiCharacter.toBase58());
    console.log("computeMint", computeMint.toBase58());
    await program.methods
      .createAiCharacterComputeAccount()
      .accounts({
        aiNft: appAinftPda,
        aiCharacter: aiCharacter,
        computeMint: computeMint,
        aiCharacterMint: aiCharacterMint,
        aiCharacterMetadata: aiCharacterMetadata,
        aiCharacterComputeTokenAccount: aiCharacterComputeTokenAccount,
        payer: payer.publicKey,
      })
      .signers([payer])
      .rpc();



    // Verify the compute token account was created
    const computeTokenAccountInfo = await provider.connection.getAccountInfo(aiCharacterComputeTokenAccount);
    console.log("computeTokenAccountInfo", computeTokenAccountInfo);
    assert.ok(computeTokenAccountInfo !== null, "Compute token account should exist");

    // Verify the AI character was updated with the compute token account
    const aiCharacterAccountWithCompute = await program.account.aiCharacterNft.fetch(aiCharacter);

    console.log("aiCharacterAccountWithCompute", aiCharacterAccountWithCompute);
    console.log("aiCharacterComputeTokenAccount", aiCharacterComputeTokenAccount.toString());
    console.log("aiCharacterAccountWithCompute.computeTokenAccount", aiCharacterAccountWithCompute.computeTokenAccount.toString());
    assert.ok(aiCharacterAccountWithCompute.computeTokenAccount.toString() === aiCharacterComputeTokenAccount.toString(), "AI character should have compute token account set");


    // Verify collection state was updated
    const finalAinft = await program.account.aiNft.fetch(appAinftPda);
    assert.equal(finalAinft.mintCount.toString(), "1", "Mint count should be 1");
    assert.equal(finalAinft.mintCount.toString(), "1", "Total agents should be 1");

    // check that the ai character is minted to payerAiCharacterTokenAccount
    const aiCharacterTokenBalance = await provider.connection.getTokenAccountBalance(payerAiCharacterTokenAccount);
    assert.equal(aiCharacterTokenBalance.value.amount, "1", "AI Character should be minted to payerAiCharacterTokenAccount");


    const stringToByteArray = (str: string, length: number): number[] => {
      const bytes = new TextEncoder().encode(str);
      const paddedArray = new Uint8Array(length);
      paddedArray.set(bytes.slice(0, length));
      return Array.from(paddedArray);
    };
    // Test updating character config fields individually
    console.log("Testing character config field updates");

    // Update name
    await program.methods
      .updateCharacterName("Updated Assistant")
      .accounts({
        aiNft: appAinftPda,
        aiCharacter: aiCharacter,
        authority: payer.publicKey,
        aiCharacterMint: aiCharacterMint,
        authorityAiCharacterTokenAccount: payerAiCharacterTokenAccount
      })
      .signers([payer])
      .rpc();

    // Update clients
    console.log("Updating clients");
    await program.methods
      .updateCharacterClients(["default", "web", "mobile"])
      .accounts({
        aiNft: appAinftPda,
        aiCharacter: aiCharacter,
        authority: payer.publicKey,
        aiCharacterMint: aiCharacterMint,
        authorityAiCharacterTokenAccount: payerAiCharacterTokenAccount,
      })
      .signers([payer])
      .rpc();

    // Update model provider
    console.log("Updating model provider");
    await program.methods
      .updateCharacterModelProvider("anthropic")
      .accounts({
        aiNft: appAinftPda,
        aiCharacter: aiCharacter,
        authority: payer.publicKey,
        aiCharacterMint: aiCharacterMint,
        authorityAiCharacterTokenAccount: payerAiCharacterTokenAccount,
      })
      .signers([payer])
      .rpc();

    // Update voice settings
    console.log("Updating voice settings");
    const voiceModel = Array(32).fill(0);
    const voiceModelText = "en-US-neural";
    voiceModelText.split('').forEach((char, i) => {
      if (i < 32) voiceModel[i] = char.charCodeAt(0);
    });

    await program.methods
      .updateCharacterVoiceSettings(voiceModel)
      .accounts({
        aiNft: appAinftPda,
        aiCharacter: aiCharacter,
        authority: payer.publicKey,
        aiCharacterMint: aiCharacterMint,
        authorityAiCharacterTokenAccount: payerAiCharacterTokenAccount,
      })
      .signers([payer])
      .rpc();

    // Update bio
    console.log("Updating bio");
    await program.methods
      .updateCharacterBio(["An advanced AI assistant", "Specialized in coding"])
      .accounts({
        aiNft: appAinftPda,
        aiCharacter: aiCharacter,
        authority: payer.publicKey,
        aiCharacterMint: aiCharacterMint,
        authorityAiCharacterTokenAccount: payerAiCharacterTokenAccount,
      })
      .signers([payer])
      .rpc();

    // Update lore
    console.log("Updating lore");
    await program.methods
      .updateCharacterLore(["Created by expert developers", "Trained on vast code repositories"])
      .accounts({
        aiNft: appAinftPda,
        aiCharacter: aiCharacter,
        authority: payer.publicKey,
        aiCharacterMint: aiCharacterMint,
        authorityAiCharacterTokenAccount: payerAiCharacterTokenAccount,
      })
      .signers([payer])
      .rpc();

    // Update knowledge
    console.log("Updating knowledge");
    await program.methods
      .updateCharacterKnowledge(["Programming", "Software Architecture", "Best Practices"])
      .accounts({
        aiNft: appAinftPda,
        aiCharacter: aiCharacter,
        authority: payer.publicKey,
        aiCharacterMint: aiCharacterMint,
        authorityAiCharacterTokenAccount: payerAiCharacterTokenAccount,
      })
      .signers([payer])
      .rpc();

    // Update topics
    console.log("Updating topics");
    await program.methods
      .updateCharacterTopics(["Code Review", "System Design", "Testing"])
      .accounts({
        aiNft: appAinftPda,
        aiCharacter: aiCharacter,
        authority: payer.publicKey,
        aiCharacterMint: aiCharacterMint,
        authorityAiCharacterTokenAccount: payerAiCharacterTokenAccount,
      })
      .signers([payer])
      .rpc();

    // Update style all
    console.log("Updating style all");
    const styleAll = Array(10).fill(Array(32).fill(0)).map((_, i) => {
      const text = i === 0 ? "Professional" : "";
      const arr = Array(32).fill(0);
      text.split('').forEach((char, j) => {
        if (j < 32) arr[j] = char.charCodeAt(0);
      });
      return arr;
    });

    await program.methods
      .updateCharacterStyleAll(styleAll)
      .accounts({
        aiNft: appAinftPda,
        aiCharacter: aiCharacter,
        authority: payer.publicKey,
        aiCharacterMint: aiCharacterMint,
        authorityAiCharacterTokenAccount: payerAiCharacterTokenAccount,
      })
      .signers([payer])
      .rpc();

    // Update style chat
    console.log("Updating style chat");
    const styleChat = Array(10).fill(Array(32).fill(0)).map((_, i) => {
      const text = i === 0 ? "Friendly" : "";
      const arr = Array(32).fill(0);
      text.split('').forEach((char, j) => {
        if (j < 32) arr[j] = char.charCodeAt(0);
      });
      return arr;
    });

    await program.methods
      .updateCharacterStyleChat(styleChat)
      .accounts({
        aiNft: appAinftPda,
        aiCharacter: aiCharacter,
        authority: payer.publicKey,
        aiCharacterMint: aiCharacterMint,
        authorityAiCharacterTokenAccount: payerAiCharacterTokenAccount,
      })
      .signers([payer])
      .rpc();

    // Update style post
    console.log("Updating style post");
    const stylePost = Array(10).fill(Array(32).fill(0)).map((_, i) => {
      const text = i === 0 ? "Technical" : "";
      const arr = Array(32).fill(0);
      text.split('').forEach((char, j) => {
        if (j < 32) arr[j] = char.charCodeAt(0);
      });
      return arr;
    });

    await program.methods
      .updateCharacterStylePost(stylePost)
      .accounts({
        aiNft: appAinftPda,
        aiCharacter: aiCharacter,
        authority: payer.publicKey,
        aiCharacterMint: aiCharacterMint,
        authorityAiCharacterTokenAccount: payerAiCharacterTokenAccount,
      })
      .signers([payer])
      .rpc();

    // Update adjectives
    console.log("Updating adjectives");
    await program.methods
      .updateCharacterAdjectives(["Expert", "Efficient", "Reliable"])
      .accounts({
        aiNft: appAinftPda,
        aiCharacter: aiCharacter,
        authority: payer.publicKey,
        aiCharacterMint: aiCharacterMint,
        authorityAiCharacterTokenAccount: payerAiCharacterTokenAccount,
      })
      .signers([payer])
      .rpc();

    // Verify the updates
    const updatedAiCharacter = await program.account.aiCharacterNft.fetch(aiCharacter);

    // Convert byte arrays to strings for verification
    const updatedName = String.fromCharCode(...updatedAiCharacter.characterConfig.name.filter(b => b !== 0));
    const updatedClients = updatedAiCharacter.characterConfig.clients.map(c =>
      String.fromCharCode(...c.filter(b => b !== 0))
    ).filter(s => s.length > 0);
    const updatedModelProvider = String.fromCharCode(...updatedAiCharacter.characterConfig.modelProvider.filter(b => b !== 0));

    // Verify updates
    assert.equal(updatedName, "Updated Assistant", "Name should be updated");
    assert.equal(updatedClients[0], "default", "First client should be 'default'");
    assert.equal(updatedModelProvider, "anthropic", "Model provider should be updated");

    /// update the character config 
  });




  it.only("Can stake compute, send messages, and unstake compute", async () => {
    // First mint an AI NFT (using previous test setup)
    const aiNftMetadata = {
      name: "AI Character #1",
      uri: "https://example.com/character1.json",
      characterConfig: {
        name: "Helpful Assistant",
        clients: ["default"],
        modelProvider: "openai",
        settings: {
          voice: {
            model: "eleven-labs"
          }
        },
        plugins: [],
        bio: ["AI programming assistant"],
        lore: ["Created to help developers write better code"],
        knowledge: ["Programming", "Software Development"],
        messageExamples: [
          [{
            user: "How can I help you?",
            content: {
              role: "assistant",
              content: "I'm here to help with programming!"
            }
          }]
        ],
        postExamples: ["Here's how to solve this coding problem..."],
        topics: ["Programming", "Technology"],
        style: {
          tone: "Professional",
          writing: "Technical"
        },
        adjectives: ["helpful", "knowledgeable", "patient"]
      }
    };

    const [aiCharacterMint] = findAiCharacterMintPDA(appAinftPda, aiNftMetadata.name);
    const [aiCharacter] = findAiCharacterPDA(aiCharacterMint);
    const [aiCharacterMetadata] = findMetadataPDA(aiCharacterMint);

    // airdrop 2 sol to ai character
    const airdropAmount = 10 * LAMPORTS_PER_SOL;
    await provider.connection.requestAirdrop(aiCharacter, airdropAmount);

    const payerAiCharacterTokenAccount = await anchor.utils.token.associatedAddress({
      mint: aiCharacterMint,
      owner: payer.publicKey
    });

    // Mint the AI character
    const signature = await provider.connection.requestAirdrop(
      payer.publicKey,
      200 * anchor.web3.LAMPORTS_PER_SOL
    );
    await provider.connection.confirmTransaction(signature);

    console.log("Minting AI character");
    await program.methods
      .mintAinft(aiNftMetadata.name, aiNftMetadata.uri)
      .accounts({
        payer: payer.publicKey,
        aiNft: appAinftPda,
        aiCharacter: aiCharacter,
        aiCharacterMint: aiCharacterMint,
        aiCharacterMetadata: aiCharacterMetadata,
        payerAiCharacterTokenAccount: payerAiCharacterTokenAccount,
      })
      .signers([payer])
      .rpc();

    // Create compute token account for the AI character
    const aiCharacterComputeTokenAccount = await anchor.utils.token.associatedAddress({
      mint: computeMint,
      owner: aiCharacter
    });

    console.log("Create compute token account for aiCharacter");
    await program.methods
      .createAiCharacterComputeAccount()
      .accounts({
        aiNft: appAinftPda,
        aiCharacter: aiCharacter,
        aiCharacterMint: aiCharacterMint,
        computeMint: computeMint,
        aiCharacterComputeTokenAccount: aiCharacterComputeTokenAccount,
        payer: payer.publicKey,
      })
      .signers([payer])
      .rpc();

    // Create compute token account for staking
    const stakerComputeAccount = await anchor.utils.token.associatedAddress({
      mint: computeMint,
      owner: payer.publicKey
    });

    // The tokens have already been minted in the beforeEach block
    console.log("Using compute tokens that were minted in the setup");

    // transfer 50 compute tokens to the ai character using spl transfer
    console.log("Transferring 50 compute tokens to the ai character");
    const transferIx = await spl.createTransferInstruction(
      stakerComputeAccount,
      aiCharacterComputeTokenAccount,
      payer.publicKey,
      100_000_000_000
    )

    const tx = new Transaction().add(transferIx);
    await provider.sendAndConfirm(tx, [payer]);

    // check that there are 50 compute tokens in the ai character
    const aiCharacterComputeTokenBalance = await provider.connection.getTokenAccountBalance(aiCharacterComputeTokenAccount);
    assert.equal(aiCharacterComputeTokenBalance.value.amount, "100000000000", "AI character should have 50 compute tokens");

    // Register execution client
    const [executionClient, executionClientBump] = PublicKey.findProgramAddressSync(
      [Buffer.from("execution_client"), appAinftPda.toBuffer(), payer.publicKey.toBuffer()],
      program.programId
    );
    console.log("executionClient", executionClient.toBase58());
    console.log("executionClientBump", executionClientBump);

    const executionClientComputeAccount = await anchor.utils.token.associatedAddress({
      mint: computeMint,
      owner: executionClient
    });

    const [stakedMint] = PublicKey.findProgramAddressSync(
      [Buffer.from("staked_mint"), appAinftPda.toBuffer(), executionClient.toBuffer()],
      program.programId
    );

    const stakedTokenAccount = await anchor.utils.token.associatedAddress({
      mint: computeMint,
      owner: appAinftPda
    });

    console.log("Registering execution client");
    const gasFee = new BN(10_000_000_000);
    await program.methods
      .registerExecutionClient(
        gasFee, // gas fee is 10 compute
        ["text"], // supported message types
        50, // staker fee share (50%)
        executionClientBump
      )
      .accounts({
        aiNft: appAinftPda,
        executionClient: executionClient,
        computeTokenAccount: executionClientComputeAccount,
        stakedTokenAccount: stakedTokenAccount,
        computeMint: computeMint,
        signer: payer.publicKey,
        stakedMint: stakedMint,
      })
      .signers([payer])
      .rpc();


    // test that gas, supported message types, and staker fee share are set correctly
    const executionClientAccountInitialization = await program.account.executionClient.fetch(executionClient);
    console.log("executionClientAccountInitialization", executionClientAccountInitialization);
    assert.equal(executionClientAccountInitialization.gas.toString(), "10000000000");
    assert.equal(executionClientAccountInitialization.supportedMessageTypes.length, 1);
    assert.equal(executionClientAccountInitialization.stakerFeeShare, 50);

    // Get the AI character's token account
    const aiCharacterTokenAccount = await anchor.utils.token.associatedAddress({
      mint: aiCharacterMint,
      owner: payer.publicKey
    });

    await program.methods
      .updateAiCharacterExecutionClient()
      .accounts({
        aiNft: appAinftPda,
        aiCharacter: aiCharacter,
        authority: payer.publicKey,
        aiCharacterMint: aiCharacterMint,
        aiCharacterTokenAccount: aiCharacterTokenAccount,
        executionClient: executionClient,
      })
      .signers([payer])
      .rpc();

    // Verify the update
    const aiCharacterAccountNewExecutionClient = await program.account.aiCharacterNft.fetch(aiCharacter);
    assert.equal(aiCharacterAccountNewExecutionClient.executionClient.toString(), executionClient.toString());

    // Create stake account
    const [staker] = PublicKey.findProgramAddressSync(
      [Buffer.from("staker"), executionClient.toBuffer(), payer.publicKey.toBuffer()],
      program.programId
    );

    console.log("Creating stake account");
    await program.methods
      .createStakeAccount()
      .accounts({
        aiNft: appAinftPda,
        executionClient: executionClient,
        staker: staker,
        stakerTokenAccount: stakerComputeAccount,
        computeMint: computeMint,
        authority: payer.publicKey,
      })
      .signers([payer])
      .rpc();

    // Stake compute tokens
    const stakeAmount = new BN(500);
    const authorityLiquidStakingTokenAccount = await anchor.utils.token.associatedAddress({
      mint: stakedMint,
      owner: payer.publicKey
    });

    console.log("Staking compute tokens");

    // check that the stakerComputeAccount has 450 compute tokens
    const stakerComputeAccountBalance = await provider.connection.getTokenAccountBalance(stakerComputeAccount);
    assert.equal(stakerComputeAccountBalance.value.amount, "100000000000", "Staker compute account should have 450 compute tokens");

    await program.methods
      .stakeCompute(stakeAmount)
      .accounts({
        aiNft: appAinftPda,
        executionClient: executionClient,
        stakePoolTokenAccount: stakedTokenAccount,
        liquidStakingTokenMint: stakedMint,
        authorityComputeAccount: stakerComputeAccount,
        authorityLiquidStakingTokenAccount: authorityLiquidStakingTokenAccount,
        stakerAccount: staker,
        authority: payer.publicKey,
      })
      .signers([payer])
      .rpc();

    // Verify stake amount
    const stakerData = await program.account.staker.fetch(staker);
    assert.equal(stakerData.amount.toString(), stakeAmount.toString());
    const stakerTokenBalance = await provider.connection.getTokenAccountBalance(stakerComputeAccount);
    assert.equal(stakerTokenBalance.value.amount, "99999999500");
    // Send a message
    const messageCount = (await program.account.aiCharacterNft.fetch(aiCharacter)).messageCount;
    console.log("messageCount", messageCount);
    const [messageAccount] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("message"),
        appAinftPda.toBuffer(),
        aiCharacter.toBuffer(),
        new BN(messageCount).toArrayLike(Buffer, 'le', 8)  // Ensure correct byte format
      ],
      program.programId
    );

    console.log("Sending message");
    const messageText = "Hello AI!";

    // Create a token account for the sender to hold compute tokens
    const senderComputeTokenAccount = await anchor.utils.token.associatedAddress({
      mint: computeMint,
      owner: payer.publicKey
    });

    // Mint some compute tokens to the

    await program.methods
      .sendMessage(messageText)
      .accounts({
        message: messageAccount,
        aiNft: appAinftPda,
        aiCharacter: aiCharacter,
        computeTokenReceiver: aiCharacterComputeTokenAccount,
        senderComputeToken: senderComputeTokenAccount,
        sender: payer.publicKey,
      })
      .signers([payer])
      .rpc();

    // Write a response (simulating execution client)
    const response = {
      content: "Hello human!",
      actions: [],
    };

    console.log("Writing response");
    await program.methods
      .writeResponse(response)
      .accounts({
        message: messageAccount,
        aiNft: appAinftPda,
        aiCharacterNft: aiCharacter,
        aiCharacterComputeTokenAccount: aiCharacterComputeTokenAccount,
        stakedTokenAccount: stakedTokenAccount,
        executionClient: executionClient,
        computeMint: computeMint,
        executionClientComputeTokenAddress: executionClientComputeAccount,
        authority: payer.publicKey,
        tokenAAccount: null,
        tokenBAccount: null,
        poolProgram: null,
      })
      .signers([payer])
      .rpc();

    // Verify message count increased
    const aiCharacterAccount = await program.account.aiCharacterNft.fetch(aiCharacter);
    assert.equal(aiCharacterAccount.messageCount.toString(), "1");
    // check the account balances of the staker and the execution client

    // calculate the expected fee share of the staker and the execution clien


    const executionClientAccount = await program.account.executionClient.fetch(executionClient);
    console.log("executionClientAccount", executionClientAccount);
    console.log("gas fee", executionClientAccount.gas.toString());
    const executionClientTokenBalance = await provider.connection.getTokenAccountBalance(executionClientComputeAccount);
    assert.equal(executionClientTokenBalance.value.amount, "5000000000");

    // Test updating execution client
    console.log("Testing execution client update");
    // Create a new execution client for testing
    const newExecutionClient = anchor.web3.Keypair.generate();
    const [newExecutionClientPda, newExecutionClientBump] = PublicKey.findProgramAddressSync(
      [Buffer.from("execution_client"), appAinftPda.toBuffer(), newExecutionClient.publicKey.toBuffer()],
      program.programId
    );

    const newExecutionClientComputeAccount = await anchor.utils.token.associatedAddress({
      mint: computeMint,
      owner: newExecutionClientPda
    });

    const [newStakedMint] = PublicKey.findProgramAddressSync(
      [Buffer.from("staked_mint"), appAinftPda.toBuffer(), newExecutionClientPda.toBuffer()],
      program.programId
    );



    // Update the AI character's execution client
    await program.methods
      .updateAiCharacterExecutionClient()
      .accounts({
        aiNft: appAinftPda,
        aiCharacter: aiCharacter,
        authority: payer.publicKey,
        aiCharacterMint: aiCharacterMint,
        aiCharacterTokenAccount: payerAiCharacterTokenAccount,
        executionClient: executionClient,
      })
      .signers([payer])
      .rpc();

    // Verify the execution client was updated
    const finalAiCharacter = await program.account.aiCharacterNft.fetch(aiCharacter);
    assert.ok(finalAiCharacter.executionClient.equals(executionClient), "Execution client should be updated");

    // Unstake compute tokens
    console.log("Unstaking compute tokens");
    await program.methods
      .unstakeCompute(stakeAmount)
      .accounts({
        aiNft: appAinftPda,
        executionClient: executionClient,
        liquidStakingTokenMint: stakedMint,
        stakePoolTokenAccount: stakedTokenAccount,
        authorityComputeAccount: stakerComputeAccount,
        authorityLiquidStakingTokenAccount: authorityLiquidStakingTokenAccount,
        stakerAccount: staker,
        authority: payer.publicKey,
      })
      .signers([payer])
      .rpc();

    // Verify unstake
    const finalStakerData = await program.account.staker.fetch(staker);
    assert.equal(finalStakerData.amount.toString(), "0");
  });

  it("Can mint a token outside the program and set it as the compute token", async () => {
    // Create a new AI NFT collection without initializing the compute mint
    const payer = provider.wallet

    // Setup payer and airdrop
    const signature = await provider.connection.requestAirdrop(
      payer.publicKey,
      20 * anchor.web3.LAMPORTS_PER_SOL
    );
    await provider.connection.confirmTransaction(signature);

    // Create the AI NFT collection
    const [appAinftPda] = findAppAinftPDA();
    const [masterMint] = findMasterMintPDA();
    const [masterMetadata] = findMetadataPDA(masterMint);
    const masterToken = await anchor.utils.token.associatedAddress({
      mint: masterMint,
      owner: payer.publicKey
    });

    const defaultExecutionClient = anchor.web3.Keypair.generate().publicKey;
    const createAiNftParams = {
      name: "External Token Collection",
      uri: "https://example.com/external-token.json",
      symbol: "EXT",
      defaultExecutionClient: defaultExecutionClient,
      mintPrice: new BN(100),
      maxSupply: new BN(100),
      computeMint: PublicKey.default,
    };

    console.log("Creating AI NFT collection without compute mint");
    await program.methods
      .createAppAinft(createAiNftParams)
      .accounts({
        aiNft: appAinftPda,
        masterMint: masterMint,
        masterToken: masterToken,
        masterMetadata: masterMetadata,
        payer: payer.publicKey,
      })
      .signers([payer])
      .rpc();

    // Verify the collection was created correctly
    const ainftAccount = await program.account.aiNft.fetch(appAinftPda);
    assert.ok(ainftAccount.authority.equals(payer.publicKey), "Authority mismatch");
    assert.ok(ainftAccount.masterMint.toBase58() === masterMint.toBase58(), "Master mint mismatch");
    assert.ok(ainftAccount.computeMint.equals(PublicKey.default), "Compute mint should be default (not initialized)");

    // Create an external token mint outside of the program
    console.log("Creating external token mint");
    const externalTokenMint = await spl.createMint(
      provider.connection,
      payer,
      payer.publicKey,  // mint authority
      null,  // freeze authority (optional)
      9  // decimals (same as in the program)
    );
    console.log("External token mint created:", externalTokenMint.toBase58());

    // Create a token account for the payer
    const payerTokenAccount = await spl.getOrCreateAssociatedTokenAccount(
      provider.connection,
      payer,
      externalTokenMint,
      payer.publicKey
    );

    // Mint some tokens to the payer
    await spl.mintTo(
      provider.connection,
      payer,
      externalTokenMint,
      payerTokenAccount.address,
      payer.publicKey,
      1000000000000  // 1000 tokens with 9 decimals
    );

    // Verify the tokens were minted
    const payerTokenBalance = await provider.connection.getTokenAccountBalance(payerTokenAccount.address);
    assert.equal(payerTokenBalance.value.amount, "1000000000000", "Payer should have 1000 tokens");

    // Set the external token as the compute token for the AI NFT
    console.log("Setting external token as compute token");
    await program.methods
      .setExternalComputeMint()
      .accounts({
        aiNft: appAinftPda,
        externalComputeMint: externalTokenMint,
        authority: payer.publicKey,
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
      })
      .signers([payer])
      .rpc();

    // Verify the compute mint was set correctly
    const updatedAinftAccount = await program.account.aiNft.fetch(appAinftPda);
    assert.ok(updatedAinftAccount.computeMint.equals(externalTokenMint), "Compute mint should be set to external token");

    // Now test using the external token for an AI NFT operation
    // First mint an AI NFT
    const aiCharacterName = "External Token Character";
    const aiNftMetadata = {
      name: aiCharacterName,
      uri: "https://example.com/external-character.json",
    };

    const [aiCharacterMint] = findAiCharacterMintPDA(appAinftPda, aiNftMetadata.name);
    const [aiCharacter] = findAiCharacterPDA(aiCharacterMint);
    const [aiCharacterMetadata] = findMetadataPDA(aiCharacterMint);

    const payerAiCharacterTokenAccount = await anchor.utils.token.associatedAddress({
      mint: aiCharacterMint,
      owner: payer.publicKey
    });

    console.log("Minting AI character");
    await program.methods
      .mintAinft(aiNftMetadata.name, aiNftMetadata.uri)
      .accounts({
        payer: payer.publicKey,
        aiNft: appAinftPda,
        aiCharacter: aiCharacter,
        aiCharacterMint: aiCharacterMint,
        aiCharacterMetadata: aiCharacterMetadata,
        payerAiCharacterTokenAccount: payerAiCharacterTokenAccount,
      })
      .signers([payer])
      .rpc();

    // Create compute token account for the AI character
    const aiCharacterComputeTokenAccount = await anchor.utils.token.associatedAddress({
      mint: externalTokenMint,
      owner: aiCharacter
    });

    console.log("Creating AI character compute account");
    await program.methods
      .createAiCharacterComputeAccount()
      .accounts({
        aiNft: appAinftPda,
        aiCharacter: aiCharacter,
        aiCharacterMint: aiCharacterMint,
        computeMint: externalTokenMint,
        aiCharacterMetadata: aiCharacterMetadata,
        aiCharacterComputeTokenAccount: aiCharacterComputeTokenAccount,
        payer: payer.publicKey,
      })
      .signers([payer])
      .rpc();

    // Transfer some tokens to the AI character
    console.log("Transferring tokens to the AI character");
    const transferIx = await spl.createTransferInstruction(
      payerTokenAccount.address,
      aiCharacterComputeTokenAccount,
      payer.publicKey,
      100000000000  // 100 tokens with 9 decimals
    );

    const tx = new Transaction().add(transferIx);
    await provider.sendAndConfirm(tx, [payer]);

    // Verify the tokens were transferred
    const aiCharacterTokenBalance = await provider.connection.getTokenAccountBalance(aiCharacterComputeTokenAccount);
    assert.equal(aiCharacterTokenBalance.value.amount, "100000000000", "AI character should have 100 tokens");

    console.log("Successfully used externally minted token as compute token");
  });
});
