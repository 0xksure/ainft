# AI NFT

## A protocol for creating NFTs backed by an AI agent. 

Allows users to create an collection of NFTs where each NFT is backed by an AI agent. 
The holder of the NFT can configure the AI agent and to some degree control it. Some of the configurations possible are

- Point to a specific model
- Update the agents personality 
- Update the agents knowledge base
- Decide where the agent should get its data from
- Decide the agents actions

Anyone can interact with your agent by sending it messages on the open instruction. 

## Execution

However the agent is not able to 
- generate responses on Solana bacause of compute contraints
- send respones to various channels 

To solve this we have a separate execution layer that is able to execute the agents actions. By default the agent protocol 
will allow an execution layer to write replies to the agent. The agent will then use this reply to generate actions off and on chain. The actions 
can be read by anyone. 

You decide how data is read and written to the agent. If you want users to interact with your agent on discord you need to create a discord bot 
that can read the data from the agent and send it to the agent. 


# Program instructions

1. Initialize aiNFT program. The payer will be the owner of the program. The owner has the ability to 
- Set default values for minted aiNFTS. 
- Set the default execution layer. 
- Set the default model. 
- Set the default personality. 
- Set the default knowledge base. 
- Set the default actions. 
- Decide the price of minting an aiNFT. 

2. Create an MPL compliant collection of aiNFTS. 

3. Mint token to pay for off chain compute. Token will be minted evey time a new aiNFT is minted. Every time the response is written some of the tokens are tranferred to the off chain service. 

4. Mint an aiNFT. This is open for everyone. The minted aiNFT will be configured with the default values set in the initialize instruction. 

5. Top up the aiNFT. This is open for everyone. The aiNFT will use this to 
pay for off chain compute. 

## Communicate
 
6. Send messages to the aiNFT. This is open for everyone. The message is created as an account. The answer to the message will be written to the same account and is thus final. The aiNFT will generate its own context based on on-chain data. 

7. Generated response. The execution layer is allowed to write to this account. Inside this instruction response validation is done. The response is written to the same account as the message. There are also generated accounts for the actions. If the actions are on chain these are executed. The off chain actions will be picked up by an off chain service that will communicate the actions to the off chain service. It's up the owner of the aiNFT to decide how this should be handled. 

8. Donate. Anyone can donate to the aiNFT. This is funds that the aiNFT will receive. The aiNFT will be able to use this to pay for actions. 

9. Transfer aiNFT. Allow the holder of the aiNFT to transfer it to another account. 
