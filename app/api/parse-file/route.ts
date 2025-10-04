import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { pdf as pdfParse } from "pdf-parse";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient();

    // Check authentication
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get the uploaded file
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Check file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: "File too large (max 10MB)" },
        { status: 400 }
      );
    }

    let text = "";

    // Parse based on file type
    if (file.type === "application/pdf") {
      // For PDF parsing, we'll use pdf-parse library
      try {
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const data = await pdfParse(buffer);
        text = data.text;
      } catch (error) {
        console.error("PDF parsing error:", error);
        return NextResponse.json(
          { error: "Failed to parse PDF. The file might be corrupted or password-protected." },
          { status: 500 }
        );
      }
    } else if (file.type.startsWith("text/") || 
               file.type === "application/msword" ||
               file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
      // For text files and Word documents
      try {
        if (file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
          // For .docx files, we'll use mammoth
          const mammoth = await import("mammoth");
          const arrayBuffer = await file.arrayBuffer();
          const result = await mammoth.extractRawText({ arrayBuffer });
          text = result.value;
        } else if (file.type === "application/msword") {
          // For .doc files, return error as we need specialized library
          return NextResponse.json(
            { error: ".doc files are not supported. Please convert to .docx or .txt" },
            { status: 400 }
          );
        } else {
          // For plain text files
          text = await file.text();
        }
      } catch (error) {
        console.error("Text parsing error:", error);
        return NextResponse.json(
          { error: "Failed to parse file" },
          { status: 500 }
        );
      }
    } else {
      return NextResponse.json(
        { error: "Unsupported file type" },
        { status: 400 }
      );
    }

    // Basic text cleanup
    text = text
      .replace(/\r\n/g, "\n") // Normalize line endings
      .replace(/\n{3,}/g, "\n\n") // Remove excessive newlines
      .trim();

    if (!text) {
      return NextResponse.json(
        { error: "No text content found in file" },
        { status: 400 }
      );
    }

    return NextResponse.json({
      text,
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
    });
  } catch (error) {
    console.error("File parsing error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
