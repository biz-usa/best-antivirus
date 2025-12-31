
import { notFound } from "next/navigation";
import { getAdminUserById } from "@/app/cms/admin/actions";
import { ModeratorForm } from "@/app/cms/admin/moderators/_components/moderator-form";
import { serializeForClient } from "@/lib/serializeForClient";

type Props = {
    params: Promise<{ id: string }>
}

export default async function EditModeratorPage({ params }: Props) {
    const { id } = await params;
    const user = await getAdminUserById(id);

    if (!user) {
        notFound();
    }
    
    const safeUser = serializeForClient(user);

    return (
       <div className="flex flex-col gap-6">
            <header>
                 <h1 className="text-2xl font-semibold">Edit Moderator</h1>
                <p className="text-muted-foreground mt-1">
                    Modify the details for the moderator.
                </p>
            </header>
            <ModeratorForm initialData={safeUser} />
        </div>
    )
}
