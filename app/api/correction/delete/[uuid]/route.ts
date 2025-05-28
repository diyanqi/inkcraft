// app/api/correction/delete/[uuid]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth'; // Assuming your auth setup is in auth.ts
import { CorrectionUtil } from '@/utils/corrections'; // Assuming CorrectionUtil is in utils/corrections.ts

export async function DELETE(
    request: NextRequest,
    { params }: { params: { uuid: string } }
) {
    const uuid = params.uuid;

    if (!uuid) {
        return NextResponse.json({ success: false, message: 'Missing UUID' }, { status: 400 });
    }

    const session = await auth();

    if (!session || !session.user || !session.user.email) {
        return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const userEmail = session.user.email;
    const correctionUtil = new CorrectionUtil();

    try {
        // First, verify the correction belongs to the authenticated user
        const correction = await correctionUtil.getByUuid(uuid);

        if (!correction) {
            return NextResponse.json({ success: false, message: 'Correction not found' }, { status: 404 });
        }

        if (correction.user_email !== userEmail) {
            return NextResponse.json({ success: false, message: 'Forbidden: You do not own this correction' }, { status: 403 });
        }

        // If verification passes, proceed with deletion
        const success = await correctionUtil.deleteByUuid(uuid);

        if (success) {
            return NextResponse.json({ success: true, message: 'Correction deleted successfully' }, { status: 200 });
        } else {
            // Although deleteByUuid returns true on success, adding a fallback
             return NextResponse.json({ success: false, message: 'Failed to delete correction' }, { status: 500 });
        }

    } catch (error: any) {
        console.error('Error deleting correction:', error);
        return NextResponse.json({ success: false, message: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
