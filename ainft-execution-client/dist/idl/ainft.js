"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AINFT_IDL = exports.AINFT_PROGRAM_ID = void 0;
const web3_js_1 = require("@solana/web3.js");
exports.AINFT_PROGRAM_ID = new web3_js_1.PublicKey('ArLePiNppazCKH1obDtf6BVUaid7h5YxEpP4UGpjMqo5');
exports.AINFT_IDL = {
    "version": "0.1.0",
    "name": "ainft",
    "instructions": [
        {
            "name": "sendMessage",
            "accounts": [
                {
                    "name": "message",
                    "isMut": true,
                    "isSigner": false
                },
                {
                    "name": "aiNft",
                    "isMut": false,
                    "isSigner": false
                },
                {
                    "name": "aiCharacter",
                    "isMut": true,
                    "isSigner": false
                },
                {
                    "name": "computeToken",
                    "isMut": true,
                    "isSigner": false
                },
                {
                    "name": "computeTokenReceiver",
                    "isMut": true,
                    "isSigner": false
                },
                {
                    "name": "senderComputeToken",
                    "isMut": true,
                    "isSigner": false
                },
                {
                    "name": "sender",
                    "isMut": false,
                    "isSigner": true
                },
                {
                    "name": "tokenProgram",
                    "isMut": false,
                    "isSigner": false
                },
                {
                    "name": "systemProgram",
                    "isMut": false,
                    "isSigner": false
                }
            ],
            "args": [
                {
                    "name": "content",
                    "type": "string"
                }
            ]
        },
        {
            "name": "writeResponse",
            "accounts": [
                {
                    "name": "message",
                    "isMut": true,
                    "isSigner": false
                },
                {
                    "name": "aiNft",
                    "isMut": false,
                    "isSigner": false
                },
                {
                    "name": "aiCharacter",
                    "isMut": true,
                    "isSigner": false
                },
                {
                    "name": "executionClient",
                    "isMut": true,
                    "isSigner": false
                },
                {
                    "name": "executionClientComputeToken",
                    "isMut": true,
                    "isSigner": false
                },
                {
                    "name": "authority",
                    "isMut": false,
                    "isSigner": true
                },
                {
                    "name": "tokenProgram",
                    "isMut": false,
                    "isSigner": false
                },
                {
                    "name": "systemProgram",
                    "isMut": false,
                    "isSigner": false
                }
            ],
            "args": [
                {
                    "name": "response",
                    "type": "string"
                }
            ]
        }
    ],
    "accounts": [
        {
            "name": "MessageAiCharacter",
            "type": {
                "kind": "struct",
                "fields": [
                    {
                        "name": "aiNft",
                        "type": "publicKey"
                    },
                    {
                        "name": "aiCharacter",
                        "type": "publicKey"
                    },
                    {
                        "name": "sender",
                        "type": "publicKey"
                    },
                    {
                        "name": "content",
                        "type": "string"
                    },
                    {
                        "name": "response",
                        "type": {
                            "option": "string"
                        }
                    },
                    {
                        "name": "answered",
                        "type": "bool"
                    },
                    {
                        "name": "bump",
                        "type": "u8"
                    }
                ]
            }
        },
        {
            "name": "ExecutionClient",
            "type": {
                "kind": "struct",
                "fields": [
                    {
                        "name": "aiNft",
                        "type": "publicKey"
                    },
                    {
                        "name": "authority",
                        "type": "publicKey"
                    },
                    {
                        "name": "computeTokenAddress",
                        "type": "publicKey"
                    },
                    {
                        "name": "gas",
                        "type": "u64"
                    },
                    {
                        "name": "computeMint",
                        "type": "publicKey"
                    },
                    {
                        "name": "liquidStakingTokenMint",
                        "type": "publicKey"
                    },
                    {
                        "name": "stakePoolTokenAccount",
                        "type": "publicKey"
                    },
                    {
                        "name": "totalCompute",
                        "type": "u64"
                    },
                    {
                        "name": "totalStaked",
                        "type": "u64"
                    },
                    {
                        "name": "totalProcessed",
                        "type": "u64"
                    },
                    {
                        "name": "stakerFeeShare",
                        "type": "u8"
                    },
                    {
                        "name": "active",
                        "type": "bool"
                    },
                    {
                        "name": "supportedMessageTypes",
                        "type": {
                            "vec": "string"
                        }
                    },
                    {
                        "name": "bump",
                        "type": "u8"
                    }
                ]
            }
        }
    ]
};
