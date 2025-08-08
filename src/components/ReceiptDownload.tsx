import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Download, FileText, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface ReceiptDownloadProps {
  orderId: string;
  orderStatus: string;
  customerName: string;
  className?: string;
  variant?: "default" | "outline" | "secondary" | "ghost" | "link" | "destructive";
  size?: "default" | "sm" | "lg" | "icon";
}

const ReceiptDownload: React.FC<ReceiptDownloadProps> = ({ 
  orderId, 
  orderStatus, 
  customerName,
  className,
  variant = "outline",
  size = "sm"
}) => {
  const [generating, setGenerating] = useState(false);

  const isEligibleForReceipt = () => {
    const eligibleStatuses = ['processing', 'shipped', 'delivered'];
    return eligibleStatuses.includes(orderStatus.toLowerCase());
  };

  const generateReceipt = async () => {
    if (!isEligibleForReceipt()) {
      toast.error('Receipt is only available for confirmed orders');
      return;
    }

    setGenerating(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('generate-receipt', {
        body: { orderId }
      });

      if (error) throw error;

      if (data?.html) {
        // Create a new window/tab with the receipt
        const receiptWindow = window.open('', '_blank');
        if (receiptWindow) {
          receiptWindow.document.write(data.html);
          receiptWindow.document.close();
          
          // Add print functionality
          setTimeout(() => {
            receiptWindow.print();
          }, 500);
          
          toast.success('Receipt generated successfully!');
        } else {
          toast.error('Please allow pop-ups to download your receipt');
        }
      } else {
        throw new Error('No receipt data received');
      }
    } catch (error) {
      console.error('Receipt generation error:', error);
      toast.error('Failed to generate receipt. Please try again.');
    } finally {
      setGenerating(false);
    }
  };

  if (!isEligibleForReceipt()) {
    return null;
  }

  return (
    <Button
      variant={variant}
      size={size}
      onClick={generateReceipt}
      disabled={generating}
      className={className}
    >
      {generating ? (
        <>
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          Generating...
        </>
      ) : (
        <>
          <FileText className="h-4 w-4 mr-2" />
          Download Receipt
        </>
      )}
    </Button>
  );
};

export default ReceiptDownload;