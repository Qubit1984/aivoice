import { DeepgramError, createClient } from "@deepgram/sdk";
import { NextResponse } from "next/server";

export const config = {
  runtime: "edge", // for Edge API Routes only
  unstable_allowDynamic: [
    // allows a single file
    "/lib/utilities.js",
    // use a glob to allow anything in the function-bind 3rd party module
    "/node_modules/function-bind/**",
  ],
};
export default async function GET(request: Request) {
  // gotta use the request object to invalidate the cache every request :vomit:
  //const url = request.url;
  const url =
    "https://api.deepgram.com/v1/listen?smart_format=true&language=ja&model=nova-2";
  const deepgram = createClient(process.env.DEEPGRAM_API_KEY ?? "");

  let { result: projectsResult, error: projectsError } =
    await deepgram.manage.getProjects();

  if (projectsError) {
    return NextResponse.json(projectsError);
  }

  const project = projectsResult?.projects[0];

  if (!project) {
    return NextResponse.json(
      new DeepgramError(
        "Cannot find a Deepgram project. Please create a project first."
      )
    );
  }

  let { result: newKeyResult, error: newKeyError } =
    await deepgram.manage.createProjectKey(project.project_id, {
      comment: "Temporary API key",
      scopes: ["usage:write"],
      tags: ["next.js"],
      time_to_live_in_seconds: 10,
    });

  if (newKeyError) {
    return NextResponse.json(newKeyError);
  }

  return NextResponse.json({ ...newKeyResult, url });
}
