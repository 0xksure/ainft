/**
 * Program IDL in camelCase format in order to be used in JS/TS.
 *
 * Note that this is only a type helper and is not the actual IDL. The original
 * IDL can be found at `target/idl/ainft.json`.
 */
export type IDL = {
    "address": "ArLePiNppazCKH1obDtf6BVUaid7h5YxEpP4UGpjMqo5",
    "metadata": {
        "name": "ainft",
        "version": "0.1.0",
        "spec": "0.1.0",
        "description": "AI NFT Protocol - A protocol for creating NFTs backed by an AI agent"
    },
    "docs": [
        "AI NFT Program",
        "",
        "A Solana program for creating and managing AI-powered NFTs that can interact with users",
        "through various execution clients."
    ],
    "instructions": [
        {
            "name": "createAiCharacterComputeAccount",
            "docs": [
                "Creates a compute token account for an AI character"
            ],
            "discriminator": [
                231,
                107,
                49,
                48,
                42,
                200,
                228,
                252
            ],
            "accounts": [
                {
                    "name": "aiNft",
                    "writable": true,
                    "pda": {
                        "seeds": [
                            {
                                "kind": "const",
                                "value": [
                                    97,
                                    112,
                                    112,
                                    95,
                                    97,
                                    105,
                                    110,
                                    102,
                                    116
                                ]
                            },
                            {
                                "kind": "account",
                                "path": "ai_nft.master_mint",
                                "account": "aiNft"
                            }
                        ]
                    }
                },
                {
                    "name": "aiCharacter",
                    "writable": true
                },
                {
                    "name": "aiCharacterMint",
                    "docs": [
                        "The mint of the AI character NFT"
                    ]
                },
                {
                    "name": "computeMint",
                    "docs": [
                        "The compute mint of the AI NFT"
                    ]
                },
                {
                    "name": "aiCharacterComputeTokenAccount",
                    "writable": true,
                    "pda": {
                        "seeds": [
                            {
                                "kind": "account",
                                "path": "aiCharacter"
                            },
                            {
                                "kind": "const",
                                "value": [
                                    6,
                                    221,
                                    246,
                                    225,
                                    215,
                                    101,
                                    161,
                                    147,
                                    217,
                                    203,
                                    225,
                                    70,
                                    206,
                                    235,
                                    121,
                                    172,
                                    28,
                                    180,
                                    133,
                                    237,
                                    95,
                                    91,
                                    55,
                                    145,
                                    58,
                                    140,
                                    245,
                                    133,
                                    126,
                                    255,
                                    0,
                                    169
                                ]
                            },
                            {
                                "kind": "account",
                                "path": "computeMint"
                            }
                        ],
                        "program": {
                            "kind": "const",
                            "value": [
                                140,
                                151,
                                37,
                                143,
                                78,
                                36,
                                137,
                                241,
                                187,
                                61,
                                16,
                                41,
                                20,
                                142,
                                13,
                                131,
                                11,
                                90,
                                19,
                                153,
                                218,
                                255,
                                16,
                                132,
                                4,
                                142,
                                123,
                                216,
                                219,
                                233,
                                248,
                                89
                            ]
                        }
                    }
                },
                {
                    "name": "payer",
                    "writable": true,
                    "signer": true
                },
                {
                    "name": "tokenProgram",
                    "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
                },
                {
                    "name": "associatedTokenProgram",
                    "address": "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL"
                },
                {
                    "name": "systemProgram",
                    "address": "11111111111111111111111111111111"
                },
                {
                    "name": "rent",
                    "address": "SysvarRent111111111111111111111111111111111"
                }
            ],
            "args": []
        },
        {
            "name": "createAppAinft",
            "docs": [
                "Creates a new AI NFT collection",
                "",
                "A collection serves as a container for AI NFTs with shared properties like",
                "maximum supply, mint price, and default execution client.",
                "",
                "# Arguments",
                "* `name` - The name of the collection",
                "* `max_supply` - Maximum number of NFTs that can be minted in this collection",
                "* `mint_price` - Price in lamports to mint each NFT",
                "* `default_execution_client` - Default execution client for NFTs in this collection"
            ],
            "discriminator": [
                58,
                102,
                204,
                199,
                79,
                84,
                32,
                49
            ],
            "accounts": [
                {
                    "name": "aiNft",
                    "writable": true,
                    "pda": {
                        "seeds": [
                            {
                                "kind": "const",
                                "value": [
                                    97,
                                    112,
                                    112,
                                    95,
                                    97,
                                    105,
                                    110,
                                    102,
                                    116
                                ]
                            },
                            {
                                "kind": "account",
                                "path": "masterMint"
                            }
                        ]
                    }
                },
                {
                    "name": "masterMint",
                    "writable": true,
                    "pda": {
                        "seeds": [
                            {
                                "kind": "const",
                                "value": [
                                    109,
                                    105,
                                    110,
                                    116
                                ]
                            },
                            {
                                "kind": "account",
                                "path": "payer"
                            }
                        ]
                    }
                },
                {
                    "name": "masterToken",
                    "writable": true,
                    "pda": {
                        "seeds": [
                            {
                                "kind": "account",
                                "path": "payer"
                            },
                            {
                                "kind": "const",
                                "value": [
                                    6,
                                    221,
                                    246,
                                    225,
                                    215,
                                    101,
                                    161,
                                    147,
                                    217,
                                    203,
                                    225,
                                    70,
                                    206,
                                    235,
                                    121,
                                    172,
                                    28,
                                    180,
                                    133,
                                    237,
                                    95,
                                    91,
                                    55,
                                    145,
                                    58,
                                    140,
                                    245,
                                    133,
                                    126,
                                    255,
                                    0,
                                    169
                                ]
                            },
                            {
                                "kind": "account",
                                "path": "masterMint"
                            }
                        ],
                        "program": {
                            "kind": "const",
                            "value": [
                                140,
                                151,
                                37,
                                143,
                                78,
                                36,
                                137,
                                241,
                                187,
                                61,
                                16,
                                41,
                                20,
                                142,
                                13,
                                131,
                                11,
                                90,
                                19,
                                153,
                                218,
                                255,
                                16,
                                132,
                                4,
                                142,
                                123,
                                216,
                                219,
                                233,
                                248,
                                89
                            ]
                        }
                    }
                },
                {
                    "name": "masterMetadata",
                    "writable": true,
                    "pda": {
                        "seeds": [
                            {
                                "kind": "const",
                                "value": [
                                    109,
                                    101,
                                    116,
                                    97,
                                    100,
                                    97,
                                    116,
                                    97
                                ]
                            },
                            {
                                "kind": "account",
                                "path": "metadataProgram"
                            },
                            {
                                "kind": "account",
                                "path": "masterMint"
                            }
                        ],
                        "program": {
                            "kind": "account",
                            "path": "metadataProgram"
                        }
                    }
                },
                {
                    "name": "payer",
                    "writable": true,
                    "signer": true
                },
                {
                    "name": "tokenProgram",
                    "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
                },
                {
                    "name": "metadataProgram",
                    "address": "metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s"
                },
                {
                    "name": "associatedTokenProgram",
                    "address": "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL"
                },
                {
                    "name": "systemProgram",
                    "address": "11111111111111111111111111111111"
                },
                {
                    "name": "rent",
                    "address": "SysvarRent111111111111111111111111111111111"
                }
            ],
            "args": [
                {
                    "name": "createAiNftParams",
                    "type": {
                        "defined": {
                            "name": "createAiNftParams"
                        }
                    }
                }
            ]
        },
        {
            "name": "createComputeMint",
            "docs": [
                "Creates a compute mint for an AI NFT"
            ],
            "discriminator": [
                205,
                227,
                62,
                87,
                244,
                129,
                134,
                102
            ],
            "accounts": [
                {
                    "name": "aiNft",
                    "writable": true,
                    "pda": {
                        "seeds": [
                            {
                                "kind": "const",
                                "value": [
                                    97,
                                    112,
                                    112,
                                    95,
                                    97,
                                    105,
                                    110,
                                    102,
                                    116
                                ]
                            },
                            {
                                "kind": "account",
                                "path": "ai_nft.master_mint",
                                "account": "aiNft"
                            }
                        ]
                    }
                },
                {
                    "name": "computeMint",
                    "writable": true,
                    "pda": {
                        "seeds": [
                            {
                                "kind": "const",
                                "value": [
                                    99,
                                    111,
                                    109,
                                    112,
                                    117,
                                    116,
                                    101,
                                    95,
                                    109,
                                    105,
                                    110,
                                    116
                                ]
                            },
                            {
                                "kind": "account",
                                "path": "aiNft"
                            }
                        ]
                    }
                },
                {
                    "name": "payer",
                    "writable": true,
                    "signer": true
                },
                {
                    "name": "tokenProgram",
                    "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
                },
                {
                    "name": "systemProgram",
                    "address": "11111111111111111111111111111111"
                },
                {
                    "name": "rent",
                    "address": "SysvarRent111111111111111111111111111111111"
                }
            ],
            "args": []
        },
        {
            "name": "createStakeAccount",
            "docs": [
                "Creates a new stake account for an execution client"
            ],
            "discriminator": [
                105,
                24,
                131,
                19,
                201,
                250,
                157,
                73
            ],
            "accounts": [
                {
                    "name": "aiNft",
                    "writable": true,
                    "pda": {
                        "seeds": [
                            {
                                "kind": "const",
                                "value": [
                                    97,
                                    112,
                                    112,
                                    95,
                                    97,
                                    105,
                                    110,
                                    102,
                                    116
                                ]
                            },
                            {
                                "kind": "account",
                                "path": "ai_nft.master_mint",
                                "account": "aiNft"
                            }
                        ]
                    }
                },
                {
                    "name": "executionClient",
                    "writable": true,
                    "pda": {
                        "seeds": [
                            {
                                "kind": "const",
                                "value": [
                                    101,
                                    120,
                                    101,
                                    99,
                                    117,
                                    116,
                                    105,
                                    111,
                                    110,
                                    95,
                                    99,
                                    108,
                                    105,
                                    101,
                                    110,
                                    116
                                ]
                            },
                            {
                                "kind": "account",
                                "path": "aiNft"
                            },
                            {
                                "kind": "account",
                                "path": "execution_client.authority",
                                "account": "executionClient"
                            }
                        ]
                    }
                },
                {
                    "name": "staker",
                    "writable": true,
                    "pda": {
                        "seeds": [
                            {
                                "kind": "const",
                                "value": [
                                    115,
                                    116,
                                    97,
                                    107,
                                    101,
                                    114
                                ]
                            },
                            {
                                "kind": "account",
                                "path": "executionClient"
                            },
                            {
                                "kind": "account",
                                "path": "authority"
                            }
                        ]
                    }
                },
                {
                    "name": "stakerTokenAccount",
                    "writable": true,
                    "pda": {
                        "seeds": [
                            {
                                "kind": "account",
                                "path": "authority"
                            },
                            {
                                "kind": "const",
                                "value": [
                                    6,
                                    221,
                                    246,
                                    225,
                                    215,
                                    101,
                                    161,
                                    147,
                                    217,
                                    203,
                                    225,
                                    70,
                                    206,
                                    235,
                                    121,
                                    172,
                                    28,
                                    180,
                                    133,
                                    237,
                                    95,
                                    91,
                                    55,
                                    145,
                                    58,
                                    140,
                                    245,
                                    133,
                                    126,
                                    255,
                                    0,
                                    169
                                ]
                            },
                            {
                                "kind": "account",
                                "path": "computeMint"
                            }
                        ],
                        "program": {
                            "kind": "const",
                            "value": [
                                140,
                                151,
                                37,
                                143,
                                78,
                                36,
                                137,
                                241,
                                187,
                                61,
                                16,
                                41,
                                20,
                                142,
                                13,
                                131,
                                11,
                                90,
                                19,
                                153,
                                218,
                                255,
                                16,
                                132,
                                4,
                                142,
                                123,
                                216,
                                219,
                                233,
                                248,
                                89
                            ]
                        }
                    }
                },
                {
                    "name": "computeMint",
                    "docs": [
                        "The compute mint of the AI NFT"
                    ]
                },
                {
                    "name": "authority",
                    "writable": true,
                    "signer": true
                },
                {
                    "name": "tokenProgram",
                    "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
                },
                {
                    "name": "associatedTokenProgram",
                    "address": "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL"
                },
                {
                    "name": "systemProgram",
                    "address": "11111111111111111111111111111111"
                },
                {
                    "name": "rent",
                    "address": "SysvarRent111111111111111111111111111111111"
                }
            ],
            "args": []
        },
        {
            "name": "mintAinft",
            "docs": [
                "Mints a new AI NFT",
                "",
                "Creates a new AI NFT with specified character configuration and metadata.",
                "Requires payment of the collection's mint price.",
                "",
                "# Arguments",
                "* `name` - Name of the AI NFT",
                "* `uri` - URI pointing to the NFT's metadata",
                "* `character_config` - JSON configuration defining the AI's personality and behavior"
            ],
            "discriminator": [
                27,
                17,
                165,
                225,
                58,
                148,
                10,
                224
            ],
            "accounts": [
                {
                    "name": "aiNft",
                    "writable": true,
                    "pda": {
                        "seeds": [
                            {
                                "kind": "const",
                                "value": [
                                    97,
                                    112,
                                    112,
                                    95,
                                    97,
                                    105,
                                    110,
                                    102,
                                    116
                                ]
                            },
                            {
                                "kind": "account",
                                "path": "ai_nft.master_mint",
                                "account": "aiNft"
                            }
                        ]
                    }
                },
                {
                    "name": "aiCharacter",
                    "writable": true,
                    "pda": {
                        "seeds": [
                            {
                                "kind": "const",
                                "value": [
                                    97,
                                    105,
                                    110,
                                    102,
                                    116
                                ]
                            },
                            {
                                "kind": "account",
                                "path": "aiCharacterMint"
                            }
                        ]
                    }
                },
                {
                    "name": "aiCharacterMint",
                    "writable": true,
                    "pda": {
                        "seeds": [
                            {
                                "kind": "const",
                                "value": [
                                    109,
                                    105,
                                    110,
                                    116
                                ]
                            },
                            {
                                "kind": "account",
                                "path": "aiNft"
                            },
                            {
                                "kind": "arg",
                                "path": "name"
                            }
                        ]
                    }
                },
                {
                    "name": "aiCharacterMetadata",
                    "writable": true
                },
                {
                    "name": "payer",
                    "writable": true,
                    "signer": true
                },
                {
                    "name": "payerAiCharacterTokenAccount",
                    "writable": true,
                    "pda": {
                        "seeds": [
                            {
                                "kind": "account",
                                "path": "payer"
                            },
                            {
                                "kind": "const",
                                "value": [
                                    6,
                                    221,
                                    246,
                                    225,
                                    215,
                                    101,
                                    161,
                                    147,
                                    217,
                                    203,
                                    225,
                                    70,
                                    206,
                                    235,
                                    121,
                                    172,
                                    28,
                                    180,
                                    133,
                                    237,
                                    95,
                                    91,
                                    55,
                                    145,
                                    58,
                                    140,
                                    245,
                                    133,
                                    126,
                                    255,
                                    0,
                                    169
                                ]
                            },
                            {
                                "kind": "account",
                                "path": "aiCharacterMint"
                            }
                        ],
                        "program": {
                            "kind": "const",
                            "value": [
                                140,
                                151,
                                37,
                                143,
                                78,
                                36,
                                137,
                                241,
                                187,
                                61,
                                16,
                                41,
                                20,
                                142,
                                13,
                                131,
                                11,
                                90,
                                19,
                                153,
                                218,
                                255,
                                16,
                                132,
                                4,
                                142,
                                123,
                                216,
                                219,
                                233,
                                248,
                                89
                            ]
                        }
                    }
                },
                {
                    "name": "systemProgram",
                    "address": "11111111111111111111111111111111"
                },
                {
                    "name": "tokenProgram",
                    "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
                },
                {
                    "name": "associatedTokenProgram",
                    "address": "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL"
                },
                {
                    "name": "metadataProgram",
                    "address": "metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s"
                },
                {
                    "name": "rent",
                    "address": "SysvarRent111111111111111111111111111111111"
                }
            ],
            "args": [
                {
                    "name": "name",
                    "type": "string"
                },
                {
                    "name": "uri",
                    "type": "string"
                }
            ]
        },
        {
            "name": "mintCompute",
            "docs": [
                "Mints compute tokens to an AI NFT"
            ],
            "discriminator": [
                154,
                243,
                109,
                254,
                200,
                2,
                181,
                88
            ],
            "accounts": [
                {
                    "name": "aiNft",
                    "writable": true,
                    "pda": {
                        "seeds": [
                            {
                                "kind": "const",
                                "value": [
                                    97,
                                    112,
                                    112,
                                    95,
                                    97,
                                    105,
                                    110,
                                    102,
                                    116
                                ]
                            },
                            {
                                "kind": "account",
                                "path": "ai_nft.master_mint",
                                "account": "aiNft"
                            }
                        ]
                    }
                },
                {
                    "name": "computeMint",
                    "writable": true,
                    "pda": {
                        "seeds": [
                            {
                                "kind": "const",
                                "value": [
                                    99,
                                    111,
                                    109,
                                    112,
                                    117,
                                    116,
                                    101,
                                    95,
                                    109,
                                    105,
                                    110,
                                    116
                                ]
                            },
                            {
                                "kind": "account",
                                "path": "aiNft"
                            }
                        ]
                    }
                },
                {
                    "name": "recipientTokenAccount",
                    "writable": true,
                    "pda": {
                        "seeds": [
                            {
                                "kind": "account",
                                "path": "destinationUser"
                            },
                            {
                                "kind": "const",
                                "value": [
                                    6,
                                    221,
                                    246,
                                    225,
                                    215,
                                    101,
                                    161,
                                    147,
                                    217,
                                    203,
                                    225,
                                    70,
                                    206,
                                    235,
                                    121,
                                    172,
                                    28,
                                    180,
                                    133,
                                    237,
                                    95,
                                    91,
                                    55,
                                    145,
                                    58,
                                    140,
                                    245,
                                    133,
                                    126,
                                    255,
                                    0,
                                    169
                                ]
                            },
                            {
                                "kind": "account",
                                "path": "computeMint"
                            }
                        ],
                        "program": {
                            "kind": "const",
                            "value": [
                                140,
                                151,
                                37,
                                143,
                                78,
                                36,
                                137,
                                241,
                                187,
                                61,
                                16,
                                41,
                                20,
                                142,
                                13,
                                131,
                                11,
                                90,
                                19,
                                153,
                                218,
                                255,
                                16,
                                132,
                                4,
                                142,
                                123,
                                216,
                                219,
                                233,
                                248,
                                89
                            ]
                        }
                    }
                },
                {
                    "name": "destinationUser",
                    "writable": true
                },
                {
                    "name": "authority",
                    "writable": true,
                    "signer": true,
                    "relations": [
                        "aiNft"
                    ]
                },
                {
                    "name": "tokenProgram",
                    "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
                },
                {
                    "name": "associatedTokenProgram",
                    "address": "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL"
                },
                {
                    "name": "systemProgram",
                    "address": "11111111111111111111111111111111"
                },
                {
                    "name": "rent",
                    "address": "SysvarRent111111111111111111111111111111111"
                }
            ],
            "args": [
                {
                    "name": "amount",
                    "type": "u64"
                }
            ]
        },
        {
            "name": "registerExecutionClient",
            "docs": [
                "Registers an execution client"
            ],
            "discriminator": [
                150,
                244,
                184,
                181,
                102,
                138,
                204,
                98
            ],
            "accounts": [
                {
                    "name": "aiNft",
                    "writable": true,
                    "pda": {
                        "seeds": [
                            {
                                "kind": "const",
                                "value": [
                                    97,
                                    112,
                                    112,
                                    95,
                                    97,
                                    105,
                                    110,
                                    102,
                                    116
                                ]
                            },
                            {
                                "kind": "account",
                                "path": "ai_nft.master_mint",
                                "account": "aiNft"
                            }
                        ]
                    }
                },
                {
                    "name": "executionClient",
                    "writable": true,
                    "pda": {
                        "seeds": [
                            {
                                "kind": "const",
                                "value": [
                                    101,
                                    120,
                                    101,
                                    99,
                                    117,
                                    116,
                                    105,
                                    111,
                                    110,
                                    95,
                                    99,
                                    108,
                                    105,
                                    101,
                                    110,
                                    116
                                ]
                            },
                            {
                                "kind": "account",
                                "path": "aiNft"
                            },
                            {
                                "kind": "account",
                                "path": "signer"
                            }
                        ]
                    }
                },
                {
                    "name": "computeTokenAccount",
                    "writable": true,
                    "pda": {
                        "seeds": [
                            {
                                "kind": "account",
                                "path": "executionClient"
                            },
                            {
                                "kind": "const",
                                "value": [
                                    6,
                                    221,
                                    246,
                                    225,
                                    215,
                                    101,
                                    161,
                                    147,
                                    217,
                                    203,
                                    225,
                                    70,
                                    206,
                                    235,
                                    121,
                                    172,
                                    28,
                                    180,
                                    133,
                                    237,
                                    95,
                                    91,
                                    55,
                                    145,
                                    58,
                                    140,
                                    245,
                                    133,
                                    126,
                                    255,
                                    0,
                                    169
                                ]
                            },
                            {
                                "kind": "account",
                                "path": "computeMint"
                            }
                        ],
                        "program": {
                            "kind": "const",
                            "value": [
                                140,
                                151,
                                37,
                                143,
                                78,
                                36,
                                137,
                                241,
                                187,
                                61,
                                16,
                                41,
                                20,
                                142,
                                13,
                                131,
                                11,
                                90,
                                19,
                                153,
                                218,
                                255,
                                16,
                                132,
                                4,
                                142,
                                123,
                                216,
                                219,
                                233,
                                248,
                                89
                            ]
                        }
                    }
                },
                {
                    "name": "stakedTokenAccount",
                    "writable": true,
                    "pda": {
                        "seeds": [
                            {
                                "kind": "account",
                                "path": "aiNft"
                            },
                            {
                                "kind": "const",
                                "value": [
                                    6,
                                    221,
                                    246,
                                    225,
                                    215,
                                    101,
                                    161,
                                    147,
                                    217,
                                    203,
                                    225,
                                    70,
                                    206,
                                    235,
                                    121,
                                    172,
                                    28,
                                    180,
                                    133,
                                    237,
                                    95,
                                    91,
                                    55,
                                    145,
                                    58,
                                    140,
                                    245,
                                    133,
                                    126,
                                    255,
                                    0,
                                    169
                                ]
                            },
                            {
                                "kind": "account",
                                "path": "computeMint"
                            }
                        ],
                        "program": {
                            "kind": "const",
                            "value": [
                                140,
                                151,
                                37,
                                143,
                                78,
                                36,
                                137,
                                241,
                                187,
                                61,
                                16,
                                41,
                                20,
                                142,
                                13,
                                131,
                                11,
                                90,
                                19,
                                153,
                                218,
                                255,
                                16,
                                132,
                                4,
                                142,
                                123,
                                216,
                                219,
                                233,
                                248,
                                89
                            ]
                        }
                    }
                },
                {
                    "name": "computeMint",
                    "docs": [
                        "The compute mint of the AI NFT"
                    ]
                },
                {
                    "name": "signer",
                    "writable": true,
                    "signer": true
                },
                {
                    "name": "tokenProgram",
                    "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
                },
                {
                    "name": "systemProgram",
                    "address": "11111111111111111111111111111111"
                },
                {
                    "name": "associatedTokenProgram",
                    "address": "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL"
                },
                {
                    "name": "rent",
                    "address": "SysvarRent111111111111111111111111111111111"
                },
                {
                    "name": "stakedMint",
                    "writable": true,
                    "pda": {
                        "seeds": [
                            {
                                "kind": "const",
                                "value": [
                                    115,
                                    116,
                                    97,
                                    107,
                                    101,
                                    100,
                                    95,
                                    109,
                                    105,
                                    110,
                                    116
                                ]
                            },
                            {
                                "kind": "account",
                                "path": "aiNft"
                            },
                            {
                                "kind": "account",
                                "path": "executionClient"
                            }
                        ]
                    }
                }
            ],
            "args": [
                {
                    "name": "gas",
                    "type": "u64"
                },
                {
                    "name": "supportedMessageTypes",
                    "type": {
                        "vec": "string"
                    }
                },
                {
                    "name": "stakerFeeShare",
                    "type": "u8"
                },
                {
                    "name": "executionClientBump",
                    "type": "u8"
                }
            ]
        },
        {
            "name": "sendMessage",
            "docs": [
                "Sends a message to an AI NFT",
                "",
                "Allows users to interact with an AI NFT by sending messages.",
                "Requires compute tokens for processing.",
                "",
                "# Arguments",
                "* `content` - The message content"
            ],
            "discriminator": [
                57,
                40,
                34,
                178,
                189,
                10,
                65,
                26
            ],
            "accounts": [
                {
                    "name": "message",
                    "writable": true,
                    "pda": {
                        "seeds": [
                            {
                                "kind": "const",
                                "value": [
                                    109,
                                    101,
                                    115,
                                    115,
                                    97,
                                    103,
                                    101
                                ]
                            },
                            {
                                "kind": "account",
                                "path": "aiNft"
                            },
                            {
                                "kind": "account",
                                "path": "aiCharacter"
                            },
                            {
                                "kind": "account",
                                "path": "aiCharacter"
                            }
                        ]
                    }
                },
                {
                    "name": "aiNft",
                    "writable": true
                },
                {
                    "name": "aiCharacter",
                    "writable": true
                },
                {
                    "name": "computeToken",
                    "writable": true
                },
                {
                    "name": "sender",
                    "writable": true,
                    "signer": true
                },
                {
                    "name": "tokenProgram",
                    "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
                },
                {
                    "name": "systemProgram",
                    "address": "11111111111111111111111111111111"
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
            "name": "stakeCompute",
            "docs": [
                "Stakes compute tokens to an execution client"
            ],
            "discriminator": [
                137,
                44,
                172,
                105,
                24,
                138,
                165,
                149
            ],
            "accounts": [
                {
                    "name": "aiNft",
                    "writable": true
                },
                {
                    "name": "executionClient",
                    "writable": true,
                    "pda": {
                        "seeds": [
                            {
                                "kind": "const",
                                "value": [
                                    101,
                                    120,
                                    101,
                                    99,
                                    117,
                                    116,
                                    105,
                                    111,
                                    110,
                                    95,
                                    99,
                                    108,
                                    105,
                                    101,
                                    110,
                                    116
                                ]
                            },
                            {
                                "kind": "account",
                                "path": "aiNft"
                            },
                            {
                                "kind": "account",
                                "path": "authority"
                            }
                        ]
                    }
                },
                {
                    "name": "stakePoolTokenAccount",
                    "writable": true
                },
                {
                    "name": "liquidStakingTokenMint",
                    "writable": true
                },
                {
                    "name": "authorityComputeAccount",
                    "writable": true
                },
                {
                    "name": "authorityLiquidStakingTokenAccount",
                    "writable": true,
                    "pda": {
                        "seeds": [
                            {
                                "kind": "account",
                                "path": "authority"
                            },
                            {
                                "kind": "const",
                                "value": [
                                    6,
                                    221,
                                    246,
                                    225,
                                    215,
                                    101,
                                    161,
                                    147,
                                    217,
                                    203,
                                    225,
                                    70,
                                    206,
                                    235,
                                    121,
                                    172,
                                    28,
                                    180,
                                    133,
                                    237,
                                    95,
                                    91,
                                    55,
                                    145,
                                    58,
                                    140,
                                    245,
                                    133,
                                    126,
                                    255,
                                    0,
                                    169
                                ]
                            },
                            {
                                "kind": "account",
                                "path": "liquidStakingTokenMint"
                            }
                        ],
                        "program": {
                            "kind": "const",
                            "value": [
                                140,
                                151,
                                37,
                                143,
                                78,
                                36,
                                137,
                                241,
                                187,
                                61,
                                16,
                                41,
                                20,
                                142,
                                13,
                                131,
                                11,
                                90,
                                19,
                                153,
                                218,
                                255,
                                16,
                                132,
                                4,
                                142,
                                123,
                                216,
                                219,
                                233,
                                248,
                                89
                            ]
                        }
                    }
                },
                {
                    "name": "stakerAccount",
                    "docs": [
                        "pass staker account"
                    ],
                    "writable": true
                },
                {
                    "name": "authority",
                    "writable": true,
                    "signer": true
                },
                {
                    "name": "tokenProgram",
                    "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
                },
                {
                    "name": "associatedTokenProgram",
                    "address": "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL"
                },
                {
                    "name": "systemProgram",
                    "address": "11111111111111111111111111111111"
                },
                {
                    "name": "rent",
                    "address": "SysvarRent111111111111111111111111111111111"
                }
            ],
            "args": [
                {
                    "name": "amount",
                    "type": "u64"
                }
            ]
        },
        {
            "name": "unstakeCompute",
            "docs": [
                "Unstakes tokens from an execution client"
            ],
            "discriminator": [
                231,
                98,
                224,
                120,
                119,
                99,
                32,
                61
            ],
            "accounts": [
                {
                    "name": "aiNft"
                },
                {
                    "name": "executionClient",
                    "writable": true
                },
                {
                    "name": "liquidStakingTokenMint",
                    "writable": true
                },
                {
                    "name": "stakerAccount",
                    "docs": [
                        "the staker account"
                    ],
                    "writable": true
                },
                {
                    "name": "stakePoolTokenAccount",
                    "writable": true
                },
                {
                    "name": "authorityComputeAccount",
                    "writable": true
                },
                {
                    "name": "authorityLiquidStakingTokenAccount",
                    "writable": true
                },
                {
                    "name": "authority",
                    "writable": true,
                    "signer": true
                },
                {
                    "name": "tokenProgram",
                    "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
                },
                {
                    "name": "systemProgram",
                    "address": "11111111111111111111111111111111"
                }
            ],
            "args": [
                {
                    "name": "stakedAmount",
                    "type": "u64"
                }
            ]
        },
        {
            "name": "updateAiCharacterExecutionClient",
            "docs": [
                "Updates an AI NFT's execution client"
            ],
            "discriminator": [
                27,
                88,
                120,
                131,
                51,
                169,
                189,
                155
            ],
            "accounts": [
                {
                    "name": "aiNft",
                    "writable": true
                },
                {
                    "name": "aiCharacter",
                    "writable": true
                },
                {
                    "name": "authority",
                    "writable": true,
                    "signer": true
                },
                {
                    "name": "aiCharacterMint",
                    "writable": true
                },
                {
                    "name": "aiCharacterTokenAccount",
                    "writable": true
                },
                {
                    "name": "executionClient",
                    "writable": true
                }
            ],
            "args": []
        },
        {
            "name": "updateCharacterConfig",
            "docs": [
                "Updates an AI NFT's character configuration",
                "",
                "Allows NFT owners to update their AI's personality and behavior settings.",
                "",
                "# Arguments",
                "* `new_config` - New JSON configuration for the AI character"
            ],
            "discriminator": [
                5,
                27,
                176,
                53,
                249,
                27,
                46,
                166
            ],
            "accounts": [
                {
                    "name": "aiNft",
                    "writable": true
                },
                {
                    "name": "aiCharacter",
                    "writable": true
                },
                {
                    "name": "authority",
                    "writable": true,
                    "signer": true
                },
                {
                    "name": "aiCharacterMint",
                    "writable": true
                },
                {
                    "name": "aiCharacterTokenAccount",
                    "writable": true
                }
            ],
            "args": [
                {
                    "name": "characterConfig",
                    "type": {
                        "defined": {
                            "name": "characterConfigInput"
                        }
                    }
                }
            ]
        },
        {
            "name": "updateExecutionClientConfig",
            "docs": [
                "Updates execution client settings",
                "",
                "Allows clients to update their active status and supported message types.",
                "",
                "# Arguments",
                "* `new_gas` - The new gas price for the execution client"
            ],
            "discriminator": [
                186,
                40,
                175,
                183,
                196,
                168,
                197,
                84
            ],
            "accounts": [
                {
                    "name": "executionClient",
                    "writable": true
                },
                {
                    "name": "authority",
                    "signer": true
                }
            ],
            "args": [
                {
                    "name": "newGas",
                    "type": "u64"
                }
            ]
        },
        {
            "name": "writeResponse",
            "docs": [
                "Writes a response from an execution client",
                "",
                "Records the AI's response to a message. Can only be called by",
                "the assigned execution client.",
                "",
                "# Arguments",
                "* `response` - The AI's response content"
            ],
            "discriminator": [
                3,
                165,
                241,
                238,
                131,
                174,
                37,
                30
            ],
            "accounts": [
                {
                    "name": "message",
                    "writable": true
                },
                {
                    "name": "aiNft"
                },
                {
                    "name": "aiCharacterNft",
                    "writable": true
                },
                {
                    "name": "aiCharacterComputeTokenAccount",
                    "writable": true
                },
                {
                    "name": "stakedTokenAccount",
                    "writable": true
                },
                {
                    "name": "executionClient"
                },
                {
                    "name": "computeMint"
                },
                {
                    "name": "executionClientComputeTokenAddress",
                    "writable": true
                },
                {
                    "name": "authority",
                    "writable": true,
                    "signer": true
                },
                {
                    "name": "tokenAAccount",
                    "writable": true,
                    "optional": true
                },
                {
                    "name": "tokenBAccount",
                    "writable": true,
                    "optional": true
                },
                {
                    "name": "poolProgram",
                    "writable": true,
                    "optional": true
                },
                {
                    "name": "tokenProgram",
                    "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
                },
                {
                    "name": "systemProgram",
                    "address": "11111111111111111111111111111111"
                }
            ],
            "args": [
                {
                    "name": "response",
                    "type": {
                        "defined": {
                            "name": "responseWithActions"
                        }
                    }
                }
            ]
        }
    ],
    "accounts": [
        {
            "name": "aiCharacterNft",
            "discriminator": [
                79,
                205,
                26,
                255,
                242,
                7,
                165,
                39
            ]
        },
        {
            "name": "aiNft",
            "discriminator": [
                91,
                218,
                242,
                28,
                139,
                208,
                73,
                89
            ]
        },
        {
            "name": "executionClient",
            "discriminator": [
                95,
                250,
                66,
                109,
                94,
                106,
                213,
                33
            ]
        },
        {
            "name": "messageAiCharacter",
            "discriminator": [
                28,
                119,
                249,
                218,
                239,
                180,
                135,
                152
            ]
        },
        {
            "name": "staker",
            "discriminator": [
                171,
                229,
                193,
                85,
                67,
                177,
                151,
                4
            ]
        }
    ],
    "events": [
        {
            "name": "aiCharacterComputeAccountCreated",
            "discriminator": [
                249,
                17,
                189,
                1,
                221,
                93,
                106,
                233
            ]
        },
        {
            "name": "aiNftMinted",
            "discriminator": [
                53,
                74,
                13,
                211,
                104,
                78,
                196,
                40
            ]
        },
        {
            "name": "characterConfigUpdated",
            "discriminator": [
                242,
                247,
                19,
                77,
                205,
                158,
                235,
                127
            ]
        },
        {
            "name": "collectionCreated",
            "discriminator": [
                69,
                167,
                76,
                142,
                182,
                183,
                233,
                139
            ]
        },
        {
            "name": "computeMintCreated",
            "discriminator": [
                8,
                85,
                1,
                126,
                108,
                108,
                83,
                197
            ]
        },
        {
            "name": "computeStaked",
            "discriminator": [
                80,
                101,
                40,
                120,
                240,
                108,
                136,
                42
            ]
        },
        {
            "name": "computeTokensMinted",
            "discriminator": [
                41,
                227,
                195,
                74,
                247,
                31,
                254,
                160
            ]
        },
        {
            "name": "computeTokensTopUp",
            "discriminator": [
                126,
                206,
                97,
                43,
                157,
                47,
                50,
                198
            ]
        },
        {
            "name": "computeTokensTransferred",
            "discriminator": [
                8,
                177,
                44,
                184,
                253,
                98,
                156,
                204
            ]
        },
        {
            "name": "computeUnstaked",
            "discriminator": [
                72,
                184,
                51,
                232,
                249,
                244,
                21,
                55
            ]
        },
        {
            "name": "executionClientConfigUpdated",
            "discriminator": [
                118,
                2,
                193,
                240,
                215,
                71,
                24,
                140
            ]
        },
        {
            "name": "executionClientRegistered",
            "discriminator": [
                228,
                209,
                70,
                46,
                94,
                146,
                238,
                57
            ]
        },
        {
            "name": "executionClientStaked",
            "discriminator": [
                111,
                70,
                109,
                29,
                180,
                160,
                203,
                196
            ]
        },
        {
            "name": "executionClientUpdated",
            "discriminator": [
                95,
                233,
                144,
                185,
                65,
                163,
                170,
                252
            ]
        },
        {
            "name": "executionPriceUpdated",
            "discriminator": [
                162,
                19,
                3,
                179,
                116,
                121,
                58,
                235
            ]
        },
        {
            "name": "messageSent",
            "discriminator": [
                116,
                70,
                224,
                76,
                128,
                28,
                110,
                55
            ]
        },
        {
            "name": "responseWritten",
            "discriminator": [
                39,
                59,
                91,
                96,
                36,
                67,
                129,
                155
            ]
        },
        {
            "name": "stakeAccountCreated",
            "discriminator": [
                161,
                170,
                61,
                88,
                112,
                170,
                107,
                237
            ]
        },
        {
            "name": "tokenDonation",
            "discriminator": [
                6,
                113,
                149,
                224,
                66,
                234,
                223,
                170
            ]
        }
    ],
    "errors": [
        {
            "code": 6000,
            "name": "invalidExecutionClientBump",
            "msg": "Invalid execution client bump"
        },
        {
            "code": 6001,
            "name": "invalidLiquidStakingMint",
            "msg": "Invalid liquid staking mint"
        },
        {
            "code": 6002,
            "name": "invalidStaker",
            "msg": "Invalid staker"
        },
        {
            "code": 6003,
            "name": "supplyExceeded",
            "msg": "Collection supply exceeded"
        },
        {
            "code": 6004,
            "name": "invalidAgentNftTokenAccount",
            "msg": "Invalid agent nft token account"
        },
        {
            "code": 6005,
            "name": "invalidMintAuthority",
            "msg": "Invalid mint authority"
        },
        {
            "code": 6006,
            "name": "invalidAiNft",
            "msg": "Invalid AI NFT"
        },
        {
            "code": 6007,
            "name": "invalidFeeShare",
            "msg": "Invalid fee share"
        },
        {
            "code": 6008,
            "name": "invalidStakedMint",
            "msg": "Invalid staked mint"
        },
        {
            "code": 6009,
            "name": "invalidComputeVault",
            "msg": "Invalid compute vault"
        },
        {
            "code": 6010,
            "name": "invalidComputeMint",
            "msg": "Invalid compute mint"
        },
        {
            "code": 6011,
            "name": "executionClientNotActive",
            "msg": "Execution client not active"
        },
        {
            "code": 6012,
            "name": "stakeAccountAlreadyExists",
            "msg": "Stake account already exists"
        },
        {
            "code": 6013,
            "name": "stakeAccountNotFound",
            "msg": "Stake account not found"
        },
        {
            "code": 6014,
            "name": "noSupportedMessageTypes",
            "msg": "No supported message types"
        },
        {
            "code": 6015,
            "name": "invalidGasAmount",
            "msg": "Invalid gas amount"
        },
        {
            "code": 6016,
            "name": "invalidAuthority",
            "msg": "Invalid authority"
        },
        {
            "code": 6017,
            "name": "invalidOwner",
            "msg": "Invalid owner"
        },
        {
            "code": 6018,
            "name": "invalidAgentNftMint",
            "msg": "Invalid agent nft mint"
        },
        {
            "code": 6019,
            "name": "invalidSupply",
            "msg": "Invalid collection supply"
        },
        {
            "code": 6020,
            "name": "invalidMintPrice",
            "msg": "Invalid mint price"
        },
        {
            "code": 6021,
            "name": "invalidComputeAmount",
            "msg": "Invalid compute token amount"
        },
        {
            "code": 6022,
            "name": "insufficientCompute",
            "msg": "Insufficient compute tokens. Please top up your agent"
        },
        {
            "code": 6023,
            "name": "invalidExecutionClient",
            "msg": "Invalid execution client"
        },
        {
            "code": 6024,
            "name": "inactiveExecutionClient",
            "msg": "Execution client not active"
        },
        {
            "code": 6025,
            "name": "invalidStakeAmount",
            "msg": "Invalid stake amount"
        },
        {
            "code": 6026,
            "name": "unstakingCooldown",
            "msg": "Unstaking in cooldown"
        },
        {
            "code": 6027,
            "name": "invalidTransfer",
            "msg": "Invalid transfer"
        },
        {
            "code": 6028,
            "name": "transferCooldown",
            "msg": "Transfer cooldown active"
        },
        {
            "code": 6029,
            "name": "unauthorized",
            "msg": "unauthorized"
        },
        {
            "code": 6030,
            "name": "configTooLong",
            "msg": "Config string exceeds maximum length"
        },
        {
            "code": 6031,
            "name": "invalidConfigFormat",
            "msg": "Invalid config format - must be valid JSON"
        },
        {
            "code": 6032,
            "name": "unauthorizedConfigUpdate",
            "msg": "Only the NFT owner can update the character config"
        },
        {
            "code": 6033,
            "name": "invalidDonationAmount",
            "msg": "Invalid donation amount"
        },
        {
            "code": 6034,
            "name": "missingActionAccounts",
            "msg": "Missing required accounts for action"
        },
        {
            "code": 6035,
            "name": "actionExecutionFailed",
            "msg": "Action execution failed"
        },
        {
            "code": 6036,
            "name": "invalidActionParams",
            "msg": "Invalid action parameters"
        },
        {
            "code": 6037,
            "name": "computeMintNotInitialized",
            "msg": "Compute mint not initialized"
        },
        {
            "code": 6038,
            "name": "invalidTokenOwner"
        },
        {
            "code": 6039,
            "name": "overflow"
        }
    ],
    "types": [
        {
            "name": "action",
            "type": {
                "kind": "enum",
                "variants": [
                    {
                        "name": "transfer"
                    }
                ]
            }
        },
        {
            "name": "actionParams",
            "type": {
                "kind": "struct",
                "fields": [
                    {
                        "name": "actionType",
                        "type": {
                            "defined": {
                                "name": "action"
                            }
                        }
                    },
                    {
                        "name": "amount",
                        "type": {
                            "option": "u64"
                        }
                    }
                ]
            }
        },
        {
            "name": "aiCharacterComputeAccountCreated",
            "type": {
                "kind": "struct",
                "fields": [
                    {
                        "name": "aiCharacter",
                        "type": "pubkey"
                    },
                    {
                        "name": "computeTokenAccount",
                        "type": "pubkey"
                    }
                ]
            }
        },
        {
            "name": "aiCharacterNft",
            "serialization": "bytemuckunsafe",
            "repr": {
                "kind": "rust",
                "packed": true
            },
            "type": {
                "kind": "struct",
                "fields": [
                    {
                        "name": "appAiNftMint",
                        "type": "pubkey"
                    },
                    {
                        "name": "characterNftMint",
                        "type": "pubkey"
                    },
                    {
                        "name": "name",
                        "type": {
                            "array": [
                                "u8",
                                32
                            ]
                        }
                    },
                    {
                        "name": "characterConfig",
                        "type": {
                            "defined": {
                                "name": "characterConfig"
                            }
                        }
                    },
                    {
                        "name": "messageCount",
                        "type": "u64"
                    },
                    {
                        "name": "totalProcessed",
                        "type": "u64"
                    },
                    {
                        "name": "computeTokenAccount",
                        "type": "pubkey"
                    },
                    {
                        "name": "executionClient",
                        "type": "pubkey"
                    },
                    {
                        "name": "bump",
                        "type": {
                            "array": [
                                "u8",
                                1
                            ]
                        }
                    }
                ]
            }
        },
        {
            "name": "aiNft",
            "type": {
                "kind": "struct",
                "fields": [
                    {
                        "name": "authority",
                        "type": "pubkey"
                    },
                    {
                        "name": "masterMetadata",
                        "type": "pubkey"
                    },
                    {
                        "name": "masterMint",
                        "type": "pubkey"
                    },
                    {
                        "name": "computeMint",
                        "type": "pubkey"
                    },
                    {
                        "name": "defaultExecutionClient",
                        "type": "pubkey"
                    },
                    {
                        "name": "mintCount",
                        "type": "u64"
                    },
                    {
                        "name": "mintPrice",
                        "type": "u64"
                    },
                    {
                        "name": "maxSupply",
                        "type": "u64"
                    },
                    {
                        "name": "totalAgents",
                        "type": "u64"
                    },
                    {
                        "name": "bump",
                        "type": {
                            "array": [
                                "u8",
                                1
                            ]
                        }
                    }
                ]
            }
        },
        {
            "name": "aiNftMinted",
            "type": {
                "kind": "struct",
                "fields": [
                    {
                        "name": "aiNft",
                        "type": "pubkey"
                    },
                    {
                        "name": "collection",
                        "type": "pubkey"
                    },
                    {
                        "name": "owner",
                        "type": "pubkey"
                    }
                ]
            }
        },
        {
            "name": "characterConfig",
            "serialization": "bytemuckunsafe",
            "repr": {
                "kind": "rust",
                "packed": true
            },
            "type": {
                "kind": "struct",
                "fields": [
                    {
                        "name": "name",
                        "type": {
                            "array": [
                                "u8",
                                32
                            ]
                        }
                    },
                    {
                        "name": "clients",
                        "type": {
                            "array": [
                                {
                                    "array": [
                                        "u8",
                                        20
                                    ]
                                },
                                10
                            ]
                        }
                    },
                    {
                        "name": "modelProvider",
                        "type": {
                            "array": [
                                "u8",
                                20
                            ]
                        }
                    },
                    {
                        "name": "settings",
                        "type": {
                            "defined": {
                                "name": "settings"
                            }
                        }
                    },
                    {
                        "name": "bio",
                        "type": {
                            "array": [
                                {
                                    "array": [
                                        "u8",
                                        32
                                    ]
                                },
                                10
                            ]
                        }
                    },
                    {
                        "name": "lore",
                        "type": {
                            "array": [
                                {
                                    "array": [
                                        "u8",
                                        32
                                    ]
                                },
                                10
                            ]
                        }
                    },
                    {
                        "name": "knowledge",
                        "type": {
                            "array": [
                                {
                                    "array": [
                                        "u8",
                                        32
                                    ]
                                },
                                10
                            ]
                        }
                    },
                    {
                        "name": "topics",
                        "type": {
                            "array": [
                                {
                                    "array": [
                                        "u8",
                                        32
                                    ]
                                },
                                10
                            ]
                        }
                    },
                    {
                        "name": "style",
                        "type": {
                            "defined": {
                                "name": "styleConfig"
                            }
                        }
                    },
                    {
                        "name": "adjectives",
                        "type": {
                            "array": [
                                {
                                    "array": [
                                        "u8",
                                        32
                                    ]
                                },
                                10
                            ]
                        }
                    }
                ]
            }
        },
        {
            "name": "characterConfigInput",
            "type": {
                "kind": "struct",
                "fields": [
                    {
                        "name": "name",
                        "type": "string"
                    },
                    {
                        "name": "clients",
                        "type": {
                            "vec": "string"
                        }
                    },
                    {
                        "name": "modelProvider",
                        "type": "string"
                    },
                    {
                        "name": "settings",
                        "type": {
                            "defined": {
                                "name": "settingsInput"
                            }
                        }
                    },
                    {
                        "name": "bio",
                        "type": {
                            "vec": "string"
                        }
                    },
                    {
                        "name": "lore",
                        "type": {
                            "vec": "string"
                        }
                    },
                    {
                        "name": "knowledge",
                        "type": {
                            "vec": "string"
                        }
                    },
                    {
                        "name": "topics",
                        "type": {
                            "vec": "string"
                        }
                    },
                    {
                        "name": "style",
                        "type": {
                            "defined": {
                                "name": "styleConfigInput"
                            }
                        }
                    },
                    {
                        "name": "adjectives",
                        "type": {
                            "vec": "string"
                        }
                    }
                ]
            }
        },
        {
            "name": "characterConfigUpdated",
            "type": {
                "kind": "struct",
                "fields": [
                    {
                        "name": "aiNft",
                        "type": "pubkey"
                    },
                    {
                        "name": "owner",
                        "type": "pubkey"
                    },
                    {
                        "name": "newConfig",
                        "type": "string"
                    }
                ]
            }
        },
        {
            "name": "collectionCreated",
            "type": {
                "kind": "struct",
                "fields": [
                    {
                        "name": "collection",
                        "type": "pubkey"
                    },
                    {
                        "name": "authority",
                        "type": "pubkey"
                    }
                ]
            }
        },
        {
            "name": "computeMintCreated",
            "type": {
                "kind": "struct",
                "fields": [
                    {
                        "name": "aiNft",
                        "type": "pubkey"
                    },
                    {
                        "name": "computeMint",
                        "type": "pubkey"
                    }
                ]
            }
        },
        {
            "name": "computeStaked",
            "type": {
                "kind": "struct",
                "fields": [
                    {
                        "name": "executionClient",
                        "type": "pubkey"
                    },
                    {
                        "name": "staker",
                        "type": "pubkey"
                    },
                    {
                        "name": "computeAmount",
                        "type": "u64"
                    },
                    {
                        "name": "stakedAmount",
                        "type": "u64"
                    },
                    {
                        "name": "exchangeRate",
                        "type": "f64"
                    }
                ]
            }
        },
        {
            "name": "computeTokensMinted",
            "type": {
                "kind": "struct",
                "fields": [
                    {
                        "name": "aiNft",
                        "type": "pubkey"
                    },
                    {
                        "name": "amount",
                        "type": "u64"
                    },
                    {
                        "name": "destination",
                        "type": "pubkey"
                    }
                ]
            }
        },
        {
            "name": "computeTokensTopUp",
            "type": {
                "kind": "struct",
                "fields": [
                    {
                        "name": "aiNft",
                        "type": "pubkey"
                    },
                    {
                        "name": "from",
                        "type": "pubkey"
                    },
                    {
                        "name": "to",
                        "type": "pubkey"
                    },
                    {
                        "name": "amount",
                        "type": "u64"
                    }
                ]
            }
        },
        {
            "name": "computeTokensTransferred",
            "type": {
                "kind": "struct",
                "fields": [
                    {
                        "name": "from",
                        "type": "pubkey"
                    },
                    {
                        "name": "to",
                        "type": "pubkey"
                    },
                    {
                        "name": "amount",
                        "type": "u64"
                    }
                ]
            }
        },
        {
            "name": "computeUnstaked",
            "type": {
                "kind": "struct",
                "fields": [
                    {
                        "name": "executionClient",
                        "type": "pubkey"
                    },
                    {
                        "name": "staker",
                        "type": "pubkey"
                    },
                    {
                        "name": "computeAmount",
                        "type": "u64"
                    },
                    {
                        "name": "stakedAmount",
                        "type": "u64"
                    },
                    {
                        "name": "exchangeRate",
                        "type": "f64"
                    }
                ]
            }
        },
        {
            "name": "createAiNftParams",
            "type": {
                "kind": "struct",
                "fields": [
                    {
                        "name": "name",
                        "type": "string"
                    },
                    {
                        "name": "uri",
                        "type": "string"
                    },
                    {
                        "name": "symbol",
                        "type": "string"
                    },
                    {
                        "name": "defaultExecutionClient",
                        "type": "pubkey"
                    },
                    {
                        "name": "mintPrice",
                        "type": "u64"
                    },
                    {
                        "name": "maxSupply",
                        "type": "u64"
                    }
                ]
            }
        },
        {
            "name": "executionClient",
            "type": {
                "kind": "struct",
                "fields": [
                    {
                        "name": "aiNft",
                        "type": "pubkey"
                    },
                    {
                        "name": "authority",
                        "type": "pubkey"
                    },
                    {
                        "name": "computeTokenAddress",
                        "type": "pubkey"
                    },
                    {
                        "name": "gas",
                        "type": "u64"
                    },
                    {
                        "name": "computeMint",
                        "type": "pubkey"
                    },
                    {
                        "name": "liquidStakingTokenMint",
                        "type": "pubkey"
                    },
                    {
                        "name": "stakePoolTokenAccount",
                        "type": "pubkey"
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
                        "name": "bump",
                        "type": {
                            "array": [
                                "u8",
                                1
                            ]
                        }
                    },
                    {
                        "name": "supportedMessageTypes",
                        "type": {
                            "vec": "string"
                        }
                    }
                ]
            }
        },
        {
            "name": "executionClientConfigUpdated",
            "type": {
                "kind": "struct",
                "fields": [
                    {
                        "name": "client",
                        "type": "pubkey"
                    },
                    {
                        "name": "newGas",
                        "type": "u64"
                    }
                ]
            }
        },
        {
            "name": "executionClientRegistered",
            "type": {
                "kind": "struct",
                "fields": [
                    {
                        "name": "authority",
                        "type": "pubkey"
                    },
                    {
                        "name": "executionClient",
                        "type": "pubkey"
                    },
                    {
                        "name": "gas",
                        "type": "u64"
                    },
                    {
                        "name": "stake",
                        "type": "u64"
                    },
                    {
                        "name": "supportedMessageTypes",
                        "type": {
                            "vec": "string"
                        }
                    }
                ]
            }
        },
        {
            "name": "executionClientStaked",
            "type": {
                "kind": "struct",
                "fields": [
                    {
                        "name": "client",
                        "type": "pubkey"
                    },
                    {
                        "name": "authority",
                        "type": "pubkey"
                    },
                    {
                        "name": "amount",
                        "type": "u64"
                    }
                ]
            }
        },
        {
            "name": "executionClientUpdated",
            "type": {
                "kind": "struct",
                "fields": [
                    {
                        "name": "aiCharacter",
                        "type": "pubkey"
                    },
                    {
                        "name": "newExecutionClient",
                        "type": "pubkey"
                    }
                ]
            }
        },
        {
            "name": "executionPriceUpdated",
            "type": {
                "kind": "struct",
                "fields": [
                    {
                        "name": "client",
                        "type": "pubkey"
                    },
                    {
                        "name": "newPrice",
                        "type": "u64"
                    }
                ]
            }
        },
        {
            "name": "messageAiCharacter",
            "type": {
                "kind": "struct",
                "fields": [
                    {
                        "name": "aiNft",
                        "type": "pubkey"
                    },
                    {
                        "name": "aiCharacter",
                        "type": "pubkey"
                    },
                    {
                        "name": "sender",
                        "type": "pubkey"
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
            "name": "messageSent",
            "type": {
                "kind": "struct",
                "fields": [
                    {
                        "name": "aiNft",
                        "type": "pubkey"
                    },
                    {
                        "name": "message",
                        "type": "pubkey"
                    },
                    {
                        "name": "sender",
                        "type": "pubkey"
                    }
                ]
            }
        },
        {
            "name": "responseWithActions",
            "type": {
                "kind": "struct",
                "fields": [
                    {
                        "name": "content",
                        "type": "string"
                    },
                    {
                        "name": "actions",
                        "type": {
                            "vec": {
                                "defined": {
                                    "name": "actionParams"
                                }
                            }
                        }
                    }
                ]
            }
        },
        {
            "name": "responseWritten",
            "type": {
                "kind": "struct",
                "fields": [
                    {
                        "name": "aiNft",
                        "type": "pubkey"
                    },
                    {
                        "name": "message",
                        "type": "pubkey"
                    },
                    {
                        "name": "executionClient",
                        "type": "pubkey"
                    }
                ]
            }
        },
        {
            "name": "settings",
            "serialization": "bytemuckunsafe",
            "repr": {
                "kind": "rust",
                "packed": true
            },
            "type": {
                "kind": "struct",
                "fields": [
                    {
                        "name": "voice",
                        "type": {
                            "defined": {
                                "name": "voiceSettings"
                            }
                        }
                    }
                ]
            }
        },
        {
            "name": "settingsInput",
            "docs": [
                "settings input for the character config"
            ],
            "type": {
                "kind": "struct",
                "fields": [
                    {
                        "name": "voice",
                        "type": {
                            "defined": {
                                "name": "voiceSettingsInput"
                            }
                        }
                    }
                ]
            }
        },
        {
            "name": "stakeAccountCreated",
            "type": {
                "kind": "struct",
                "fields": [
                    {
                        "name": "authority",
                        "type": "pubkey"
                    },
                    {
                        "name": "executionClient",
                        "type": "pubkey"
                    },
                    {
                        "name": "staker",
                        "type": "pubkey"
                    }
                ]
            }
        },
        {
            "name": "staker",
            "type": {
                "kind": "struct",
                "fields": [
                    {
                        "name": "authority",
                        "type": "pubkey"
                    },
                    {
                        "name": "executionClient",
                        "type": "pubkey"
                    },
                    {
                        "name": "amount",
                        "type": "u64"
                    },
                    {
                        "name": "lastStakeEpoch",
                        "type": "u64"
                    },
                    {
                        "name": "unstakingEpoch",
                        "type": {
                            "option": "u64"
                        }
                    },
                    {
                        "name": "totalRewardsClaimed",
                        "type": "u64"
                    },
                    {
                        "name": "bump",
                        "type": "u8"
                    }
                ]
            }
        },
        {
            "name": "styleConfig",
            "serialization": "bytemuckunsafe",
            "repr": {
                "kind": "rust",
                "packed": true
            },
            "type": {
                "kind": "struct",
                "fields": [
                    {
                        "name": "all",
                        "type": {
                            "array": [
                                {
                                    "array": [
                                        "u8",
                                        32
                                    ]
                                },
                                10
                            ]
                        }
                    },
                    {
                        "name": "chat",
                        "type": {
                            "array": [
                                {
                                    "array": [
                                        "u8",
                                        32
                                    ]
                                },
                                10
                            ]
                        }
                    },
                    {
                        "name": "post",
                        "type": {
                            "array": [
                                {
                                    "array": [
                                        "u8",
                                        32
                                    ]
                                },
                                10
                            ]
                        }
                    }
                ]
            }
        },
        {
            "name": "styleConfigInput",
            "docs": [
                "style config input for the character config"
            ],
            "type": {
                "kind": "struct",
                "fields": [
                    {
                        "name": "all",
                        "type": {
                            "array": [
                                {
                                    "array": [
                                        "u8",
                                        32
                                    ]
                                },
                                10
                            ]
                        }
                    },
                    {
                        "name": "chat",
                        "type": {
                            "array": [
                                {
                                    "array": [
                                        "u8",
                                        32
                                    ]
                                },
                                10
                            ]
                        }
                    },
                    {
                        "name": "post",
                        "type": {
                            "array": [
                                {
                                    "array": [
                                        "u8",
                                        32
                                    ]
                                },
                                10
                            ]
                        }
                    }
                ]
            }
        },
        {
            "name": "tokenDonation",
            "type": {
                "kind": "struct",
                "fields": [
                    {
                        "name": "aiNft",
                        "type": "pubkey"
                    },
                    {
                        "name": "donor",
                        "type": "pubkey"
                    },
                    {
                        "name": "recipient",
                        "type": "pubkey"
                    },
                    {
                        "name": "tokenMint",
                        "type": "pubkey"
                    },
                    {
                        "name": "amount",
                        "type": "u64"
                    }
                ]
            }
        },
        {
            "name": "voiceSettings",
            "serialization": "bytemuckunsafe",
            "repr": {
                "kind": "rust",
                "packed": true
            },
            "type": {
                "kind": "struct",
                "fields": [
                    {
                        "name": "model",
                        "type": {
                            "array": [
                                "u8",
                                32
                            ]
                        }
                    }
                ]
            }
        },
        {
            "name": "voiceSettingsInput",
            "docs": [
                "voice settings input for the character config"
            ],
            "type": {
                "kind": "struct",
                "fields": [
                    {
                        "name": "model",
                        "type": {
                            "array": [
                                "u8",
                                32
                            ]
                        }
                    }
                ]
            }
        }
    ]
};
