import * as anchor from "@coral-xyz/anchor";
import { BN, Program } from "@coral-xyz/anchor";
import { Ainft } from "../target/types/ainft";
import { LAMPORTS_PER_SOL, PublicKey, SystemProgram, SYSVAR_RENT_PUBKEY, Transaction } from "@solana/web3.js";
import { TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID, createTransferInstruction, MINT_SIZE, createInitializeMintInstruction, createMint, mintTo, getOrCreateAssociatedTokenAccount, getAssociatedTokenAddress } from "@solana/spl-token";
import { assert, config } from "chai";
import { findMasterMintPDA, findAppAinftPDA, findComputeMintPDA, findMetadataPDA, findAiCharacterMintPDA, findAiCharacterPDA } from "../sdk-ts/src/utils";
import mpl from "@metaplex-foundation/mpl-token-metadata";
import { token } from "@coral-xyz/anchor/dist/cjs/utils";
import { before } from "node:test";

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

  beforeEach(async function () {
    // Setup payer and airdrop
    const signature = await provider.connection.requestAirdrop(
      payer.publicKey,
      10 * anchor.web3.LAMPORTS_PER_SOL
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
      computeMint: computeMint,
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

    // Verify the collection was created correctly
    var ainftAccount = await program.account.aiNft.fetch(appAinftPda);
    console.log("ainftAccount", ainftAccount);
    assert.ok(ainftAccount.authority.equals(payer.publicKey), "Authority mismatch");
    assert.ok(ainftAccount.masterMint.toBase58() === masterMint.toBase58(), "Master mint mismatch");
    assert.ok(ainftAccount.computeMint.equals(PublicKey.default), "Compute mint mismatch");
    assert.equal(ainftAccount.mintCount.toString(), "0", "Mint count should be 0");


    // create compute mint
    console.log("Creating compute mint");
    console.log("appAinftPda", appAinftPda.toBase58());
    console.log("computeMint", computeMint.toBase58());
    console.log("payer", payer.publicKey.toBase58());
    await program.methods
      .createComputeMint()
      .accounts({
        aiNft: appAinftPda,
        computeMint: computeMint,
        payer: payer.publicKey,
      })
      .signers([payer])
      .rpc();

    // Verify compute mint was created
    const computeMintAccount = await provider.connection.getAccountInfo(computeMint);
    console.log("computeMintAccount", computeMintAccount);
    assert.ok(computeMintAccount !== null, "Compute mint account should exist");
    assert.ok(computeMintAccount!.owner.equals(TOKEN_PROGRAM_ID), "Compute mint should be owned by token program");

    // Verify AiNft account was updated
    const ainftWithComputeMint = await program.account.aiNft.fetch(appAinftPda);
    assert.ok(ainftWithComputeMint.computeMint.equals(computeMint), "Compute mint should be set in AiNft account");
  });

  it.only("Mints an AI NFT successfully", async () => {

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




  it("Can stake compute, send messages, and unstake compute", async () => {
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

    // Mint some compute tokens to the staker
    console.log("Minting compute tokens to the staker");
    const mintAmount = new BN(200_000_000_000);
    await program.methods
      .mintCompute(mintAmount)
      .accounts({
        aiNft: appAinftPda,
        computeMint: computeMint,
        recipientTokenAccount: stakerComputeAccount,
        destinationUser: payer.publicKey,
        authority: payer.publicKey,
      })
      .signers([payer])
      .rpc();

    // transfer 50 compute tokens to the ai character using spl transfer
    console.log("Transferring 50 compute tokens to the ai character");
    const transferIx = await createTransferInstruction(
      stakerComputeAccount,
      aiCharacterComputeTokenAccount,
      payer.publicKey,
      100_000_000_000,
      [payer]
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
    await program.methods
      .sendMessage(messageText)
      .accounts({
        message: messageAccount,
        aiNft: appAinftPda,
        aiCharacter: aiCharacter,
        computeToken: aiCharacterComputeTokenAccount,
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

    // Register the new execution client
    await program.methods
      .registerExecutionClient(
        new BN(5_000_000_000), // 5 compute gas fee
        ["text"],
        60, // 60% staker fee share
        newExecutionClientBump
      )
      .accounts({
        aiNft: appAinftPda,
        executionClient: newExecutionClientPda,
        computeTokenAccount: newExecutionClientComputeAccount,
        stakedTokenAccount: stakedTokenAccount,
        computeMint: computeMint,
        signer: newExecutionClient.publicKey,
        stakedMint: newStakedMint,
      })
      .signers([newExecutionClient])
      .rpc();

    // Update the AI character's execution client
    await program.methods
      .updateAiCharacterExecutionClient()
      .accounts({
        aiNft: appAinftPda,
        aiCharacter: aiCharacter,
        authority: payer.publicKey,
        aiCharacterMint: aiCharacterMint,
        aiCharacterTokenAccount: payerAiCharacterTokenAccount,
        executionClient: newExecutionClientPda,
      })
      .signers([payer])
      .rpc();

    // Verify the execution client was updated
    const finalAiCharacter = await program.account.aiCharacterNft.fetch(aiCharacter);
    assert.ok(finalAiCharacter.executionClient.equals(newExecutionClientPda), "Execution client should be updated");

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
});
