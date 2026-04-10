import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db/mongodb";
import AdminModel from "@/models/Admin";
import {
	verifyState,
	exchangeCode,
	createDedicatedCalendar,
} from "@/lib/google-calendar";

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

function redirect(status: string) {
	return NextResponse.redirect(
		new URL(`/admin/utilisateurs?calendar=${status}`, BASE_URL)
	);
}

export async function GET(request: NextRequest) {
	const { searchParams } = request.nextUrl;
	const code = searchParams.get("code");
	const state = searchParams.get("state");
	const error = searchParams.get("error");

	if (error) {
		return redirect("denied");
	}

	if (!code || !state) {
		return redirect("error");
	}

	const adminId = verifyState(state);
	if (!adminId) {
		return redirect("invalid_state");
	}

	try {
		const { refreshToken } = await exchangeCode(code);
		if (!refreshToken) {
			console.error("[OAuth] No refresh token received");
			return redirect("error");
		}

		const calendarId = await createDedicatedCalendar(refreshToken);

		await connectDB();
		await AdminModel.findByIdAndUpdate(adminId, {
			googleRefreshToken: refreshToken,
			googleCalendarId: calendarId,
		});

		console.log(`[OAuth] Google Calendar connected for admin ${adminId}`);
		return redirect("success");
	} catch (err) {
		console.error("[OAuth] Callback error:", err);
		return redirect("error");
	}
}
