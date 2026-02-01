'use client';
import { useZelana,useBalance,useTransfer,Keypair } from "@zelana/react";

export default function L2Wallet() {
  const { isConnected, connect, disconnect } = useZelana();
  const { balance } = useBalance();
  const { mutate: transfer, isLoading } = useTransfer();
  
  // Example: Generate a burner wallet for demo
  const handleConnect = () => {
    const keypair = Keypair.generate();
    connect(keypair);
  };
  const handleSend = () => {
    // Logic to send transfer
    transfer({
        to: "12121212121212",
        amount: 100n
    });
  };
  if (!isConnected) {
    return <button onClick={handleConnect}>Connect L2 Wallet</button>;
  }
  return (
    <div className="p-4 border rounded">
      <h2 className="text-xl font-bold">Zelana L2</h2>
      <p>Balance: {balance?.toString() || '0'} Lamports</p>
      <button 
        onClick={handleSend}
        disabled={isLoading}
        className="bg-blue-500 text-white px-4 py-2 rounded mt-2"
      >
        {isLoading ? 'Sending...' : 'Send Transfer'}
      </button>
      <button onClick={disconnect} className="ml-2 text-red-500">
        Disconnect
      </button>
    </div>
  );
}