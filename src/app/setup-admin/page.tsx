
'use client';

import { useAuth } from '@/context/auth-context';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { promoteToSuperAdmin } from './actions';
import { useToast } from '@/hooks/use-toast';

export default function SetupAdminPage() {
    const { user, loading } = useAuth();
    const [isPromoting, setIsPromoting] = useState(false);
    const { toast } = useToast();

    if (loading) return <div>Loading...</div>;
    if (!user) return <div>Please login first.</div>;

    const handlePromote = async () => {
        setIsPromoting(true);
        try {
            await promoteToSuperAdmin(user.uid, user.email || '');
            toast({
                title: "Success",
                description: "You are now a Super Admin. Please refresh the page.",
            });
        } catch (error: any) {
            toast({
                variant: "destructive",
                title: "Error",
                description: error.message,
            });
        } finally {
            setIsPromoting(false);
        }
    };

    return (
        <div className="p-10 max-w-md mx-auto space-y-4">
            <h1 className="text-2xl font-bold">Admin Setup</h1>
            <p><strong>UID:</strong> {user.uid}</p>
            <p><strong>Email:</strong> {user.email}</p>
            <Button onClick={handlePromote} disabled={isPromoting}>
                {isPromoting ? 'Promoting...' : 'Promote Me to Super Admin'}
            </Button>
            <p className="text-sm text-muted-foreground mt-4">
                Clicking this button will create an entry in the <code>admin_users</code> collection for your account with the role <code>superadmin</code>.
                This will grant you full access to the CMS.
            </p>
        </div>
    );
}
