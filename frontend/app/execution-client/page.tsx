'use client';

import { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useAnchorProgram } from '../utils/anchor';
import { useNetworkStore } from '../stores/networkStore';
import { registerExecutionClient, updateExecutionClientConfig, fetchAllExecutionClients, fetchExecutionClientByAuthority } from '../utils/anchor';
import PageLayout from '../components/PageLayout';
import { PublicKey } from '@solana/web3.js';
import { useToast } from '../components/ui/toast';
import CopyableAddress from '../components/CopyableAddress';

// Type for execution client data
interface ExecutionClientData {
    publicKey: PublicKey;
    aiNft: PublicKey;
    authority: PublicKey;
    computeTokenAddress: PublicKey;
    gas: number;
    computeMint: PublicKey;
    liquidStakingTokenMint: PublicKey;
    stakePoolTokenAccount: PublicKey;
    totalCompute: number;
    totalStaked: number;
    totalProcessed: number;
    stakerFeeShare: number;
    active: boolean;
    supportedMessageTypes: string[];
}

export default function ExecutionClientPage() {
    const wallet = useWallet();
    const { connection } = useNetworkStore();
    const { program } = useAnchorProgram();
    const { addToast } = useToast();

    const [gas, setGas] = useState('100');
    const [messageTypes, setMessageTypes] = useState(['text']);
    const [stakerFeeShare, setStakerFeeShare] = useState('10');

    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    const [isRegistered, setIsRegistered] = useState(false);
    const [clientStats, setClientStats] = useState({
        totalRequests: 0,
        successfulRequests: 0,
        failedRequests: 0,
        averageResponseTime: 0,
        totalEarned: 0,
    });

    // State for all execution clients
    const [executionClients, setExecutionClients] = useState<ExecutionClientData[]>([]);
    const [myExecutionClients, setMyExecutionClients] = useState<ExecutionClientData[]>([]);
    const [otherExecutionClients, setOtherExecutionClients] = useState<ExecutionClientData[]>([]);
    const [loadingClients, setLoadingClients] = useState(false);

    // State for client being edited
    const [editingClient, setEditingClient] = useState<PublicKey | null>(null);
    const [newGasAmount, setNewGasAmount] = useState<string>('');
    const [updatingGas, setUpdatingGas] = useState(false);

    // State for add client modal
    const [showAddModal, setShowAddModal] = useState(false);
    const [newClientGas, setNewClientGas] = useState('100');
    const [newClientMessageTypes, setNewClientMessageTypes] = useState(['text']);
    const [newClientStakerFeeShare, setNewClientStakerFeeShare] = useState('10');
    const [registeringNewClient, setRegisteringNewClient] = useState(false);

    // Helper function to update message types
    const updateMessageType = (index: number, value: string) => {
        const newMessageTypes = [...messageTypes];
        newMessageTypes[index] = value;
        setMessageTypes(newMessageTypes);
    };

    // Helper function to add message type
    const addMessageType = () => {
        setMessageTypes([...messageTypes, '']);
    };

    // Helper function to remove message type
    const removeMessageType = (index: number) => {
        if (messageTypes.length <= 1) return;
        const newMessageTypes = [...messageTypes];
        newMessageTypes.splice(index, 1);
        setMessageTypes(newMessageTypes);
    };

    // Helper functions for modal message types
    const updateNewClientMessageType = (index: number, value: string) => {
        const updatedTypes = [...newClientMessageTypes];
        updatedTypes[index] = value;
        setNewClientMessageTypes(updatedTypes);
    };

    const addNewClientMessageType = () => {
        setNewClientMessageTypes([...newClientMessageTypes, '']);
    };

    const removeNewClientMessageType = (index: number) => {
        if (newClientMessageTypes.length <= 1) return;
        const updatedTypes = [...newClientMessageTypes];
        updatedTypes.splice(index, 1);
        setNewClientMessageTypes(updatedTypes);
    };

    // Helper function to format gas amount for display
    const formatGas = (gasAmount: number) => {
        // Convert from smallest units (1 = 0.000000001 compute tokens)
        return (gasAmount / 1_000_000_000).toFixed(9);
    };

    // Helper function to parse gas input
    const parseGasInput = (input: string): number => {
        const parsed = parseFloat(input);
        if (isNaN(parsed) || parsed <= 0) {
            throw new Error('Gas must be a positive number');
        }
        // Convert to smallest units (multiply by 10^9)
        return Math.floor(parsed * 1_000_000_000);
    };

    // Fetch execution clients on component mount
    useEffect(() => {
        const fetchClients = async () => {
            if (!program || !connection) return;

            setLoadingClients(true);
            try {
                const clients = await fetchAllExecutionClients(program, connection);
                setExecutionClients(clients.map(client => ({
                    publicKey: client.publicKey,
                    aiNft: client.account.aiNft,
                    authority: client.account.authority,
                    computeTokenAddress: client.account.computeTokenAddress,
                    gas: client.account.gas.toNumber(),
                    computeMint: client.account.computeMint,
                    liquidStakingTokenMint: client.account.liquidStakingTokenMint,
                    stakePoolTokenAccount: client.account.stakePoolTokenAccount,
                    totalCompute: client.account.totalCompute.toNumber(),
                    totalStaked: client.account.totalStaked.toNumber(),
                    totalProcessed: client.account.totalProcessed.toNumber(),
                    stakerFeeShare: client.account.stakerFeeShare,
                    active: client.account.active,
                    supportedMessageTypes: client.account.supportedMessageTypes
                })));

                // Separate my clients from others
                if (wallet.publicKey) {
                    const myClients = clients.filter(client =>
                        client.account.authority.equals(wallet.publicKey!)
                    );
                    const otherClients = clients.filter(client =>
                        !client.account.authority.equals(wallet.publicKey!)
                    );

                    setMyExecutionClients(myClients.map(client => ({
                        publicKey: client.publicKey,
                        aiNft: client.account.aiNft,
                        authority: client.account.authority,
                        computeTokenAddress: client.account.computeTokenAddress,
                        gas: client.account.gas.toNumber(),
                        computeMint: client.account.computeMint,
                        liquidStakingTokenMint: client.account.liquidStakingTokenMint,
                        stakePoolTokenAccount: client.account.stakePoolTokenAccount,
                        totalCompute: client.account.totalCompute.toNumber(),
                        totalStaked: client.account.totalStaked.toNumber(),
                        totalProcessed: client.account.totalProcessed.toNumber(),
                        stakerFeeShare: client.account.stakerFeeShare,
                        active: client.account.active,
                        supportedMessageTypes: client.account.supportedMessageTypes
                    })));
                    setOtherExecutionClients(otherClients.map(client => ({
                        publicKey: client.publicKey,
                        aiNft: client.account.aiNft,
                        authority: client.account.authority,
                        computeTokenAddress: client.account.computeTokenAddress,
                        gas: client.account.gas.toNumber(),
                        computeMint: client.account.computeMint,
                        liquidStakingTokenMint: client.account.liquidStakingTokenMint,
                        stakePoolTokenAccount: client.account.stakePoolTokenAccount,
                        totalCompute: client.account.totalCompute.toNumber(),
                        totalStaked: client.account.totalStaked.toNumber(),
                        totalProcessed: client.account.totalProcessed.toNumber(),
                        stakerFeeShare: client.account.stakerFeeShare,
                        active: client.account.active,
                        supportedMessageTypes: client.account.supportedMessageTypes
                    })));
                    setIsRegistered(myClients.length > 0);

                    // If user has a client, set the initial gas value to match their client
                    if (myClients.length > 0) {
                        setGas(formatGas(myClients[0].gas));
                    }
                } else {
                    setMyExecutionClients([]);
                    setOtherExecutionClients(clients.map(client => ({
                        publicKey: client.publicKey,
                        aiNft: client.account.aiNft,
                        authority: client.account.authority,
                        computeTokenAddress: client.account.computeTokenAddress,
                        gas: client.account.gas.toNumber(),
                        computeMint: client.account.computeMint,
                        liquidStakingTokenMint: client.account.liquidStakingTokenMint,
                        stakePoolTokenAccount: client.account.stakePoolTokenAccount,
                        totalCompute: client.account.totalCompute.toNumber(),
                        totalStaked: client.account.totalStaked.toNumber(),
                        totalProcessed: client.account.totalProcessed.toNumber(),
                        stakerFeeShare: client.account.stakerFeeShare,
                        active: client.account.active,
                        supportedMessageTypes: client.account.supportedMessageTypes
                    })));
                }
            } catch (err) {
                console.error('Error fetching execution clients:', err);
                setError(`Error fetching execution clients: ${err instanceof Error ? err.message : String(err)}`);
                addToast(`Error fetching execution clients: ${err instanceof Error ? err.message : String(err)}`, 'error');
            } finally {
                setLoadingClients(false);
            }
        };

        fetchClients();
    }, [program, connection, wallet.publicKey]);

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!wallet.connected) {
            setError('Please connect your wallet first');
            addToast('Please connect your wallet first', 'error');
            return;
        }

        if (!wallet.publicKey) {
            setError('Wallet public key not available');
            addToast('Wallet public key not available', 'error');
            return;
        }

        if (!program) {
            setError('Program not initialized');
            addToast('Program not initialized', 'error');
            return;
        }

        if (!connection) {
            setError('Connection not initialized');
            addToast('Connection not initialized', 'error');
            return;
        }

        setIsLoading(true);
        setError(null);
        setSuccess(null);

        try {
            // Validate inputs
            const gasValue = parseGasInput(gas);

            const stakerFeeShareValue = parseInt(stakerFeeShare);
            if (isNaN(stakerFeeShareValue) || stakerFeeShareValue < 0 || stakerFeeShareValue > 100) {
                throw new Error('Staker fee share must be between 0 and 100');
            }

            // Filter out empty message types
            const filteredMessageTypes = messageTypes.filter(type => type.trim() !== '');
            if (filteredMessageTypes.length === 0) {
                throw new Error('At least one message type is required');
            }

            addToast('Registering execution client...', 'info');
            // Call the registerExecutionClient function
            const { txId, executionClientAddress } = await registerExecutionClient(
                program,
                wallet,
                connection,
                gasValue,
                filteredMessageTypes,
                stakerFeeShareValue
            );

            addToast(`Execution client registered successfully!`, 'success');
            setSuccess(`Execution client registered successfully! Transaction ID: ${txId}`);
            setIsRegistered(true);

            // Update client stats with initial values
            setClientStats({
                ...clientStats,
                totalRequests: 0,
                successfulRequests: 0,
                failedRequests: 0,
                averageResponseTime: 0,
                totalEarned: 0,
            });

            // Refresh the list of execution clients
            if (connection) {
                const clients = await fetchAllExecutionClients(program, connection);
                setExecutionClients(clients.map(client => ({
                    publicKey: client.publicKey,
                    aiNft: client.account.aiNft,
                    authority: client.account.authority,
                    computeTokenAddress: client.account.computeTokenAddress,
                    gas: client.account.gas.toNumber(),
                    computeMint: client.account.computeMint,
                    liquidStakingTokenMint: client.account.liquidStakingTokenMint,
                    stakePoolTokenAccount: client.account.stakePoolTokenAccount,
                    totalCompute: client.account.totalCompute.toNumber(),
                    totalStaked: client.account.totalStaked.toNumber(),
                    totalProcessed: client.account.totalProcessed.toNumber(),
                    stakerFeeShare: client.account.stakerFeeShare,
                    active: client.account.active,
                    supportedMessageTypes: client.account.supportedMessageTypes
                })));

                // Separate my clients from others
                if (wallet.publicKey) {
                    const myClients = clients.filter(client =>
                        client.account.authority.equals(wallet.publicKey!)
                    );
                    const otherClients = clients.filter(client =>
                        !client.account.authority.equals(wallet.publicKey!)
                    );

                    setMyExecutionClients(myClients.map(client => ({
                        publicKey: client.publicKey,
                        aiNft: client.account.aiNft,
                        authority: client.account.authority,
                        computeTokenAddress: client.account.computeTokenAddress,
                        gas: client.account.gas.toNumber(),
                        computeMint: client.account.computeMint,
                        liquidStakingTokenMint: client.account.liquidStakingTokenMint,
                        stakePoolTokenAccount: client.account.stakePoolTokenAccount,
                        totalCompute: client.account.totalCompute.toNumber(),
                        totalStaked: client.account.totalStaked.toNumber(),
                        totalProcessed: client.account.totalProcessed.toNumber(),
                        stakerFeeShare: client.account.stakerFeeShare,
                        active: client.account.active,
                        supportedMessageTypes: client.account.supportedMessageTypes
                    })));
                    setOtherExecutionClients(otherClients.map(client => ({
                        publicKey: client.publicKey,
                        aiNft: client.account.aiNft,
                        authority: client.account.authority,
                        computeTokenAddress: client.account.computeTokenAddress,
                        gas: client.account.gas.toNumber(),
                        computeMint: client.account.computeMint,
                        liquidStakingTokenMint: client.account.liquidStakingTokenMint,
                        stakePoolTokenAccount: client.account.stakePoolTokenAccount,
                        totalCompute: client.account.totalCompute.toNumber(),
                        totalStaked: client.account.totalStaked.toNumber(),
                        totalProcessed: client.account.totalProcessed.toNumber(),
                        stakerFeeShare: client.account.stakerFeeShare,
                        active: client.account.active,
                        supportedMessageTypes: client.account.supportedMessageTypes
                    })));
                }
            }

        } catch (err) {
            console.error('Error registering execution client:', err);
            setError(`Error registering execution client: ${err instanceof Error ? err.message : String(err)}`);
            addToast(`Error registering execution client: ${err instanceof Error ? err.message : String(err)}`, 'error');
        } finally {
            setIsLoading(false);
        }
    };

    const handleUpdateConfig = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!wallet.connected) {
            setError('Please connect your wallet first');
            addToast('Please connect your wallet first', 'error');
            return;
        }

        if (!wallet.publicKey) {
            setError('Wallet public key not available');
            addToast('Wallet public key not available', 'error');
            return;
        }

        if (!program) {
            setError('Program not initialized');
            addToast('Program not initialized', 'error');
            return;
        }

        setIsLoading(true);
        setError(null);
        setSuccess(null);

        try {
            // Validate inputs
            const gasValue = parseGasInput(gas);

            addToast('Updating execution client configuration...', 'info');
            // Call the updateExecutionClientConfig function
            const { txId, executionClientAddress } = await updateExecutionClientConfig(
                program,
                wallet.publicKey,
                gasValue
            );

            addToast(`Execution client configuration updated successfully!`, 'success');
            setSuccess(`Execution client configuration updated successfully! Transaction ID: ${txId}`);

            // Refresh the list of execution clients
            if (connection) {
                const clients = await fetchAllExecutionClients(program, connection);
                setExecutionClients(clients.map(client => ({
                    publicKey: client.publicKey,
                    aiNft: client.account.aiNft,
                    authority: client.account.authority,
                    computeTokenAddress: client.account.computeTokenAddress,
                    gas: client.account.gas.toNumber(),
                    computeMint: client.account.computeMint,
                    liquidStakingTokenMint: client.account.liquidStakingTokenMint,
                    stakePoolTokenAccount: client.account.stakePoolTokenAccount,
                    totalCompute: client.account.totalCompute.toNumber(),
                    totalStaked: client.account.totalStaked.toNumber(),
                    totalProcessed: client.account.totalProcessed.toNumber(),
                    stakerFeeShare: client.account.stakerFeeShare,
                    active: client.account.active,
                    supportedMessageTypes: client.account.supportedMessageTypes
                })));

                // Separate my clients from others
                if (wallet.publicKey) {
                    const myClients = clients.filter(client =>
                        client.account.authority.equals(wallet.publicKey!)
                    );
                    const otherClients = clients.filter(client =>
                        !client.account.authority.equals(wallet.publicKey!)
                    );

                    setMyExecutionClients(myClients.map(client => ({
                        publicKey: client.publicKey,
                        aiNft: client.account.aiNft,
                        authority: client.account.authority,
                        computeTokenAddress: client.account.computeTokenAddress,
                        gas: client.account.gas.toNumber(),
                        computeMint: client.account.computeMint,
                        liquidStakingTokenMint: client.account.liquidStakingTokenMint,
                        stakePoolTokenAccount: client.account.stakePoolTokenAccount,
                        totalCompute: client.account.totalCompute.toNumber(),
                        totalStaked: client.account.totalStaked.toNumber(),
                        totalProcessed: client.account.totalProcessed.toNumber(),
                        stakerFeeShare: client.account.stakerFeeShare,
                        active: client.account.active,
                        supportedMessageTypes: client.account.supportedMessageTypes
                    })));
                    setOtherExecutionClients(otherClients.map(client => ({
                        publicKey: client.publicKey,
                        aiNft: client.account.aiNft,
                        authority: client.account.authority,
                        computeTokenAddress: client.account.computeTokenAddress,
                        gas: client.account.gas.toNumber(),
                        computeMint: client.account.computeMint,
                        liquidStakingTokenMint: client.account.liquidStakingTokenMint,
                        stakePoolTokenAccount: client.account.stakePoolTokenAccount,
                        totalCompute: client.account.totalCompute.toNumber(),
                        totalStaked: client.account.totalStaked.toNumber(),
                        totalProcessed: client.account.totalProcessed.toNumber(),
                        stakerFeeShare: client.account.stakerFeeShare,
                        active: client.account.active,
                        supportedMessageTypes: client.account.supportedMessageTypes
                    })));
                }
            }

        } catch (err) {
            console.error('Error updating execution client config:', err);
            setError(`Error updating execution client config: ${err instanceof Error ? err.message : String(err)}`);
            addToast(`Error updating execution client config: ${err instanceof Error ? err.message : String(err)}`, 'error');
        } finally {
            setIsLoading(false);
        }
    };

    const handleRegisterNewClient = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!wallet.connected) {
            setError('Please connect your wallet first');
            addToast('Please connect your wallet first', 'error');
            return;
        }

        if (!wallet.publicKey) {
            setError('Wallet public key not available');
            addToast('Wallet public key not available', 'error');
            return;
        }

        if (!program) {
            setError('Program not initialized');
            addToast('Program not initialized', 'error');
            return;
        }

        if (!connection) {
            setError('Connection not initialized');
            addToast('Connection not initialized', 'error');
            return;
        }

        setRegisteringNewClient(true);
        setError(null);
        setSuccess(null);

        try {
            // Validate inputs
            const gasValue = parseGasInput(newClientGas);

            const stakerFeeShareValue = parseInt(newClientStakerFeeShare);
            if (isNaN(stakerFeeShareValue) || stakerFeeShareValue < 0 || stakerFeeShareValue > 100) {
                throw new Error('Staker fee share must be between 0 and 100');
            }

            // Filter out empty message types
            const filteredMessageTypes = newClientMessageTypes.filter(type => type.trim() !== '');
            if (filteredMessageTypes.length === 0) {
                throw new Error('At least one message type is required');
            }

            addToast('Registering new execution client...', 'info');
            // Call the registerExecutionClient function
            const { txId, executionClientAddress } = await registerExecutionClient(
                program,
                wallet,
                connection,
                gasValue,
                filteredMessageTypes,
                stakerFeeShareValue
            );

            addToast(`New execution client registered successfully!`, 'success');
            setSuccess(`New execution client registered successfully! Transaction ID: ${txId}`);
            setIsRegistered(true);
            setShowAddModal(false);

            // Reset form fields
            setNewClientGas('100');
            setNewClientMessageTypes(['text']);
            setNewClientStakerFeeShare('10');

            // Refresh the list of execution clients
            if (connection) {
                const clients = await fetchAllExecutionClients(program, connection);
                setExecutionClients(clients.map(client => ({
                    publicKey: client.publicKey,
                    aiNft: client.account.aiNft,
                    authority: client.account.authority,
                    computeTokenAddress: client.account.computeTokenAddress,
                    gas: client.account.gas.toNumber(),
                    computeMint: client.account.computeMint,
                    liquidStakingTokenMint: client.account.liquidStakingTokenMint,
                    stakePoolTokenAccount: client.account.stakePoolTokenAccount,
                    totalCompute: client.account.totalCompute.toNumber(),
                    totalStaked: client.account.totalStaked.toNumber(),
                    totalProcessed: client.account.totalProcessed.toNumber(),
                    stakerFeeShare: client.account.stakerFeeShare,
                    active: client.account.active,
                    supportedMessageTypes: client.account.supportedMessageTypes
                })));

                // Separate my clients from others
                if (wallet.publicKey) {
                    const myClients = clients.filter(client =>
                        client.account.authority.equals(wallet.publicKey!)
                    );
                    const otherClients = clients.filter(client =>
                        !client.account.authority.equals(wallet.publicKey!)
                    );

                    setMyExecutionClients(myClients.map(client => ({
                        publicKey: client.publicKey,
                        aiNft: client.account.aiNft,
                        authority: client.account.authority,
                        computeTokenAddress: client.account.computeTokenAddress,
                        gas: client.account.gas.toNumber(),
                        computeMint: client.account.computeMint,
                        liquidStakingTokenMint: client.account.liquidStakingTokenMint,
                        stakePoolTokenAccount: client.account.stakePoolTokenAccount,
                        totalCompute: client.account.totalCompute.toNumber(),
                        totalStaked: client.account.totalStaked.toNumber(),
                        totalProcessed: client.account.totalProcessed.toNumber(),
                        stakerFeeShare: client.account.stakerFeeShare,
                        active: client.account.active,
                        supportedMessageTypes: client.account.supportedMessageTypes
                    })));
                    setOtherExecutionClients(otherClients.map(client => ({
                        publicKey: client.publicKey,
                        aiNft: client.account.aiNft,
                        authority: client.account.authority,
                        computeTokenAddress: client.account.computeTokenAddress,
                        gas: client.account.gas.toNumber(),
                        computeMint: client.account.computeMint,
                        liquidStakingTokenMint: client.account.liquidStakingTokenMint,
                        stakePoolTokenAccount: client.account.stakePoolTokenAccount,
                        totalCompute: client.account.totalCompute.toNumber(),
                        totalStaked: client.account.totalStaked.toNumber(),
                        totalProcessed: client.account.totalProcessed.toNumber(),
                        stakerFeeShare: client.account.stakerFeeShare,
                        active: client.account.active,
                        supportedMessageTypes: client.account.supportedMessageTypes
                    })));
                }
            }

        } catch (err) {
            console.error('Error registering new execution client:', err);
            setError(`Error registering new execution client: ${err instanceof Error ? err.message : String(err)}`);
            addToast(`Error registering new execution client: ${err instanceof Error ? err.message : String(err)}`, 'error');
        } finally {
            setRegisteringNewClient(false);
        }
    };

    const handleUpdateClientGas = async (clientPublicKey: PublicKey) => {
        if (!wallet.connected || !wallet.publicKey || !program) {
            setError('Please connect your wallet first');
            addToast('Please connect your wallet first', 'error');
            return;
        }

        setUpdatingGas(true);
        setError(null);
        setSuccess(null);

        try {
            // Validate inputs
            const gasValue = parseGasInput(newGasAmount);

            addToast(`Updating gas amount for client ${clientPublicKey.toString()}...`, 'info');

            // Call the updateExecutionClientConfig function
            const { txId } = await updateExecutionClientConfig(
                program,
                wallet.publicKey,
                gasValue,
                clientPublicKey  // Pass the specific execution client public key
            );

            addToast(`Gas updated successfully for client ${clientPublicKey.toString()}!`, 'success');
            setSuccess(`Gas updated successfully for client ${clientPublicKey.toString()}! Transaction ID: ${txId}`);
            setEditingClient(null);
            setNewGasAmount('');

            // Refresh the list of execution clients
            if (connection) {
                const clients = await fetchAllExecutionClients(program, connection);
                setExecutionClients(clients.map(client => ({
                    publicKey: client.publicKey,
                    aiNft: client.account.aiNft,
                    authority: client.account.authority,
                    computeTokenAddress: client.account.computeTokenAddress,
                    gas: client.account.gas.toNumber(),
                    computeMint: client.account.computeMint,
                    liquidStakingTokenMint: client.account.liquidStakingTokenMint,
                    stakePoolTokenAccount: client.account.stakePoolTokenAccount,
                    totalCompute: client.account.totalCompute.toNumber(),
                    totalStaked: client.account.totalStaked.toNumber(),
                    totalProcessed: client.account.totalProcessed.toNumber(),
                    stakerFeeShare: client.account.stakerFeeShare,
                    active: client.account.active,
                    supportedMessageTypes: client.account.supportedMessageTypes
                })));

                // Separate my clients from others
                if (wallet.publicKey) {
                    const myClients = clients.filter(client =>
                        client.account.authority.equals(wallet.publicKey!)
                    );
                    const otherClients = clients.filter(client =>
                        !client.account.authority.equals(wallet.publicKey!)
                    );

                    setMyExecutionClients(myClients.map(client => ({
                        publicKey: client.publicKey,
                        aiNft: client.account.aiNft,
                        authority: client.account.authority,
                        computeTokenAddress: client.account.computeTokenAddress,
                        gas: client.account.gas.toNumber(),
                        computeMint: client.account.computeMint,
                        liquidStakingTokenMint: client.account.liquidStakingTokenMint,
                        stakePoolTokenAccount: client.account.stakePoolTokenAccount,
                        totalCompute: client.account.totalCompute.toNumber(),
                        totalStaked: client.account.totalStaked.toNumber(),
                        totalProcessed: client.account.totalProcessed.toNumber(),
                        stakerFeeShare: client.account.stakerFeeShare,
                        active: client.account.active,
                        supportedMessageTypes: client.account.supportedMessageTypes
                    })));
                    setOtherExecutionClients(otherClients.map(client => ({
                        publicKey: client.publicKey,
                        aiNft: client.account.aiNft,
                        authority: client.account.authority,
                        computeTokenAddress: client.account.computeTokenAddress,
                        gas: client.account.gas.toNumber(),
                        computeMint: client.account.computeMint,
                        liquidStakingTokenMint: client.account.liquidStakingTokenMint,
                        stakePoolTokenAccount: client.account.stakePoolTokenAccount,
                        totalCompute: client.account.totalCompute.toNumber(),
                        totalStaked: client.account.totalStaked.toNumber(),
                        totalProcessed: client.account.totalProcessed.toNumber(),
                        stakerFeeShare: client.account.stakerFeeShare,
                        active: client.account.active,
                        supportedMessageTypes: client.account.supportedMessageTypes
                    })));
                }
            }

        } catch (err) {
            console.error('Error updating client gas:', err);
            setError(`Error updating client gas: ${err instanceof Error ? err.message : String(err)}`);
            addToast(`Error updating client gas: ${err instanceof Error ? err.message : String(err)}`, 'error');
        } finally {
            setUpdatingGas(false);
        }
    };

    return (
        <PageLayout>
            <div className="max-w-6xl mx-auto">
                <h1 className="text-3xl font-bold text-sky-400 mb-6">Execution Client</h1>

                {!wallet.connected ? (
                    <div className="bg-yellow-900/30 border border-yellow-800 rounded-lg p-4 mb-6">
                        <p className="text-yellow-300">Please connect your wallet to manage your execution client.</p>
                    </div>
                ) : null}

                {error && (
                    <div className="bg-red-900/30 border border-red-800 rounded-lg p-4 mb-6">
                        <p className="text-red-300">{error}</p>
                    </div>
                )}

                {success && (
                    <div className="bg-green-900/30 border border-green-800 rounded-lg p-4 mb-6">
                        <p className="text-green-300">{success}</p>
                    </div>
                )}

                {/* My Execution Clients Section */}
                {wallet.connected && (
                    <div className="bg-sky-900/20 backdrop-blur-sm rounded-xl p-6 border border-sky-800 mb-6">
                        <h2 className="text-xl font-semibold mb-4 text-sky-300">My Execution Clients</h2>

                        {loadingClients ? (
                            <div className="flex justify-center items-center p-8">
                                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-sky-400"></div>
                            </div>
                        ) : myExecutionClients.length === 0 ? (
                            <div className="text-center py-8">
                                <p className="text-gray-400 mb-4">You don't have any execution clients yet.</p>
                                <p className="text-gray-400">Register below to start processing AI NFT messages and earn rewards.</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {myExecutionClients.map((client) => (
                                    <div key={client.publicKey.toString()} className="bg-gray-800/50 rounded-lg p-4 border border-sky-800/50 hover:border-sky-600/50 transition-colors">
                                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                            <div>
                                                <div className="flex items-center gap-2 mb-2">
                                                    <CopyableAddress address={client.publicKey} className="text-sm text-gray-300" />
                                                    {client.active ? (
                                                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-900 text-green-300">
                                                            Active
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-900 text-red-300">
                                                            Inactive
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-3">
                                                    <div>
                                                        <p className="text-xs text-gray-400">Gas</p>
                                                        <p className="text-sm font-medium">{formatGas(client.gas)} tokens</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-xs text-gray-400">Staker Fee Share</p>
                                                        <p className="text-sm font-medium">{client.stakerFeeShare}%</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-xs text-gray-400">Total Processed</p>
                                                        <p className="text-sm font-medium">{client.totalProcessed} requests</p>
                                                    </div>
                                                </div>
                                                <div className="mt-3">
                                                    <p className="text-xs text-gray-400 mb-1">Supported Message Types</p>
                                                    <div className="flex flex-wrap gap-1">
                                                        {client.supportedMessageTypes.map((type, idx) => (
                                                            <span key={idx} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-700 text-gray-300">
                                                                {type}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex-shrink-0">
                                                {editingClient && editingClient.equals(client.publicKey) ? (
                                                    <div className="flex flex-col space-y-2">
                                                        <div className="flex space-x-2">
                                                            <input
                                                                type="text"
                                                                value={newGasAmount}
                                                                onChange={(e) => setNewGasAmount(e.target.value)}
                                                                placeholder="New gas amount"
                                                                className="w-32 bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white text-sm"
                                                            />
                                                            <button
                                                                onClick={() => handleUpdateClientGas(client.publicKey)}
                                                                disabled={updatingGas || !newGasAmount}
                                                                className={`px-3 py-2 rounded-md text-sm font-medium ${updatingGas || !newGasAmount
                                                                    ? 'bg-gray-600 cursor-not-allowed'
                                                                    : 'bg-sky-600 hover:bg-sky-500'
                                                                    }`}
                                                            >
                                                                {updatingGas ? 'Saving...' : 'Save'}
                                                            </button>
                                                        </div>
                                                        <button
                                                            onClick={() => {
                                                                setEditingClient(null);
                                                                setNewGasAmount('');
                                                            }}
                                                            className="px-3 py-2 bg-gray-700 rounded-md hover:bg-gray-600 text-sm"
                                                        >
                                                            Cancel
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <button
                                                        onClick={() => {
                                                            setEditingClient(client.publicKey);
                                                            setNewGasAmount(formatGas(client.gas));
                                                        }}
                                                        className="px-4 py-2 bg-sky-700 rounded-md hover:bg-sky-600 text-sm"
                                                    >
                                                        Update Gas
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* All Execution Clients Section */}
                <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700 mb-6">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-semibold">All Execution Clients</h2>
                        {wallet.connected && (
                            <button
                                onClick={() => setShowAddModal(true)}
                                className="px-3 py-1 bg-sky-700 rounded-md hover:bg-sky-600 text-sm"
                            >
                                <span className="mr-1">+</span> Add
                            </button>
                        )}
                    </div>

                    {loadingClients ? (
                        <div className="flex justify-center items-center p-8">
                            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-sky-400"></div>
                        </div>
                    ) : executionClients.length === 0 ? (
                        <p className="text-gray-400 text-center py-8">No execution clients found.</p>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-700">
                                <thead>
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Client</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Owner</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Gas</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Staker Fee Share</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Total Processed</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Message Types</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-700">
                                    {executionClients.map((client, index) => (
                                        <tr key={client.publicKey.toString()} className={`${index % 2 === 0 ? 'bg-gray-800/30' : 'bg-gray-800/10'} ${wallet.publicKey && client.authority.equals(wallet.publicKey) ? 'bg-sky-900/20' : ''}`}>
                                            <td className="px-4 py-4 whitespace-nowrap text-sm">
                                                <CopyableAddress address={client.publicKey} />
                                            </td>
                                            <td className="px-4 py-4 whitespace-nowrap text-sm">
                                                <div className="flex items-center">
                                                    <CopyableAddress address={client.authority} />
                                                    {wallet.publicKey && client.authority.equals(wallet.publicKey) && (
                                                        <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-sky-900 text-sky-300">
                                                            You
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-4 py-4 whitespace-nowrap text-sm">
                                                {formatGas(client.gas)} tokens
                                            </td>
                                            <td className="px-4 py-4 whitespace-nowrap text-sm">
                                                {client.stakerFeeShare}%
                                            </td>
                                            <td className="px-4 py-4 whitespace-nowrap text-sm">
                                                {client.totalProcessed} requests
                                            </td>
                                            <td className="px-4 py-4 whitespace-nowrap text-sm">
                                                <div className="flex flex-wrap gap-1">
                                                    {client.supportedMessageTypes.map((type, idx) => (
                                                        <span key={idx} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-700 text-gray-300">
                                                            {type}
                                                        </span>
                                                    ))}
                                                </div>
                                            </td>
                                            <td className="px-4 py-4 whitespace-nowrap text-sm">
                                                {client.active ? (
                                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-900 text-green-300">
                                                        Active
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-900 text-red-300">
                                                        Inactive
                                                    </span>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* Registration Form */}
                {!isRegistered && wallet.connected && (
                    <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700">
                        <h2 className="text-xl font-semibold mb-4">Register Execution Client</h2>
                        <p className="text-gray-300 mb-6">
                            Register as an execution client to process AI NFT messages and earn rewards.
                        </p>

                        <form onSubmit={handleRegister} className="space-y-4">
                            <div>
                                <label htmlFor="gas" className="block text-sm font-medium text-gray-300 mb-1">
                                    Gas (in compute tokens)
                                </label>
                                <input
                                    type="text"
                                    id="gas"
                                    value={gas}
                                    onChange={(e) => setGas(e.target.value)}
                                    className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white"
                                    required
                                />
                                <p className="text-xs text-gray-400 mt-1">
                                    The amount of gas you require to process a message (e.g., 2.5 for 2.5 compute tokens).
                                </p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">
                                    Supported Message Types
                                </label>
                                {messageTypes.map((type, index) => (
                                    <div key={index} className="flex mb-2">
                                        <input
                                            type="text"
                                            value={type}
                                            onChange={(e) => updateMessageType(index, e.target.value)}
                                            className="flex-1 bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white"
                                            placeholder="e.g., text, image, audio"
                                            required
                                        />
                                        <button
                                            type="button"
                                            onClick={() => removeMessageType(index)}
                                            className="ml-2 px-3 py-2 bg-red-800 rounded-md hover:bg-red-700"
                                        >
                                            -
                                        </button>
                                    </div>
                                ))}
                                <button
                                    type="button"
                                    onClick={addMessageType}
                                    className="px-3 py-1 bg-sky-700 rounded-md hover:bg-sky-600 text-sm"
                                >
                                    Add Message Type
                                </button>
                            </div>

                            <div>
                                <label htmlFor="stakerFeeShare" className="block text-sm font-medium text-gray-300 mb-1">
                                    Staker Fee Share (%)
                                </label>
                                <input
                                    type="number"
                                    id="stakerFeeShare"
                                    value={stakerFeeShare}
                                    onChange={(e) => setStakerFeeShare(e.target.value)}
                                    className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white"
                                    min="0"
                                    max="100"
                                    required
                                />
                                <p className="text-xs text-gray-400 mt-1">
                                    The percentage of fees that will be shared with stakers.
                                </p>
                            </div>

                            <div className="flex justify-end">
                                <button
                                    type="submit"
                                    disabled={isLoading || !wallet.connected}
                                    className={`px-6 py-3 rounded-lg font-medium ${isLoading || !wallet.connected
                                        ? 'bg-gray-600 cursor-not-allowed'
                                        : 'bg-gradient-to-r from-sky-600 to-sky-400 hover:opacity-90'
                                        }`}
                                >
                                    {isLoading ? 'Registering...' : 'Register Execution Client'}
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                {/* Add Execution Client Modal */}
                {showAddModal && (
                    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                        <div className="bg-gray-800 rounded-xl border border-gray-700 p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-xl font-semibold text-sky-400">Add New Execution Client</h3>
                                <button
                                    onClick={() => setShowAddModal(false)}
                                    className="text-gray-400 hover:text-white"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>

                            <form onSubmit={handleRegisterNewClient} className="space-y-4">
                                <div>
                                    <label htmlFor="newClientGas" className="block text-sm font-medium text-gray-300 mb-1">
                                        Gas (in compute tokens)
                                    </label>
                                    <input
                                        type="text"
                                        id="newClientGas"
                                        value={newClientGas}
                                        onChange={(e) => setNewClientGas(e.target.value)}
                                        className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white"
                                        required
                                    />
                                    <p className="text-xs text-gray-400 mt-1">
                                        The amount of gas you require to process a message (e.g., 2.5 for 2.5 compute tokens).
                                    </p>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-1">
                                        Supported Message Types
                                    </label>
                                    {newClientMessageTypes.map((type, index) => (
                                        <div key={index} className="flex mb-2">
                                            <input
                                                type="text"
                                                value={type}
                                                onChange={(e) => updateNewClientMessageType(index, e.target.value)}
                                                className="flex-1 bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white"
                                                placeholder="e.g., text, image, audio"
                                                required
                                            />
                                            <button
                                                type="button"
                                                onClick={() => removeNewClientMessageType(index)}
                                                className="ml-2 px-3 py-2 bg-red-800 rounded-md hover:bg-red-700"
                                            >
                                                -
                                            </button>
                                        </div>
                                    ))}
                                    <button
                                        type="button"
                                        onClick={addNewClientMessageType}
                                        className="px-3 py-1 bg-sky-700 rounded-md hover:bg-sky-600 text-sm"
                                    >
                                        Add Message Type
                                    </button>
                                </div>

                                <div>
                                    <label htmlFor="newClientStakerFeeShare" className="block text-sm font-medium text-gray-300 mb-1">
                                        Staker Fee Share (%)
                                    </label>
                                    <input
                                        type="number"
                                        id="newClientStakerFeeShare"
                                        value={newClientStakerFeeShare}
                                        onChange={(e) => setNewClientStakerFeeShare(e.target.value)}
                                        className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white"
                                        min="0"
                                        max="100"
                                        required
                                    />
                                    <p className="text-xs text-gray-400 mt-1">
                                        The percentage of fees that will be shared with stakers.
                                    </p>
                                </div>

                                <div className="flex justify-end pt-2">
                                    <button
                                        type="button"
                                        onClick={() => setShowAddModal(false)}
                                        className="px-4 py-2 bg-gray-700 rounded-md hover:bg-gray-600 text-sm mr-2"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={registeringNewClient}
                                        className={`px-4 py-2 rounded-md text-sm font-medium ${registeringNewClient
                                            ? 'bg-gray-600 cursor-not-allowed'
                                            : 'bg-gradient-to-r from-sky-600 to-sky-400 hover:opacity-90'
                                            }`}
                                    >
                                        {registeringNewClient ? 'Registering...' : 'Register Client'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </PageLayout>
    );
}