import { PublicKey } from '@solana/web3.js';
export declare const AINFT_PROGRAM_ID: PublicKey;
export declare const AINFT_IDL: {
    version: string;
    name: string;
    instructions: {
        name: string;
        accounts: {
            name: string;
            isMut: boolean;
            isSigner: boolean;
        }[];
        args: {
            name: string;
            type: string;
        }[];
    }[];
    accounts: ({
        name: string;
        type: {
            kind: string;
            fields: ({
                name: string;
                type: string;
            } | {
                name: string;
                type: {
                    option: string;
                };
            })[];
        };
    } | {
        name: string;
        type: {
            kind: string;
            fields: ({
                name: string;
                type: string;
            } | {
                name: string;
                type: {
                    vec: string;
                };
            })[];
        };
    })[];
};
