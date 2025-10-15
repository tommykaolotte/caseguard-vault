import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Constants } from "@/integrations/supabase/types";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FileText, Upload } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Document {
  id: string;
  title: string;
  created_at: string;
  status: string;
  file_path?: string | null;
  file_size?: number | null;
  mime_type?: string | null;
  cases?: {
    title: string;
    case_number: string;
  } | null;
}

interface CaseOption {
  id: string;
  title: string;
  case_number: string;
}

const Documents = () => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [cases, setCases] = useState<CaseOption[]>([]);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedCase, setSelectedCase] = useState("");
  const [documentTitle, setDocumentTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<string>(
    Constants.public.Enums.document_status[0],
  );
  const [file, setFile] = useState<File | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchDocuments();
    fetchCases();
  }, []);

  const fetchDocuments = async () => {
    try {
      const { data, error } = await supabase
        .from("documents")
        .select(`
          id,
          title,
          created_at,
          status,
          file_path,
          file_size,
          mime_type,
          cases (
            title,
            case_number
          )
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setDocuments(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to fetch documents",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchCases = async () => {
    try {
      const { data, error } = await supabase
        .from("cases")
        .select("id, title, case_number")
        .order("title", { ascending: true });

      if (error) throw error;
      setCases(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to load cases",
        variant: "destructive",
      });
    }
  };

  const handleDialogChange = (open: boolean) => {
    setUploadDialogOpen(open);
    if (!open) {
      resetForm();
    }
  };

  const resetForm = () => {
    setSelectedCase("");
    setDocumentTitle("");
    setDescription("");
    setStatus(Constants.public.Enums.document_status[0]);
    setFile(null);
  };

  const documentStatuses = Constants.public.Enums.document_status;

  const handleUpload = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!selectedCase || !documentTitle || !file) {
      toast({
        title: "Missing information",
        description: "Please select a case, add a title, and choose a file.",
        variant: "destructive",
      });
      return;
    }

    try {
      setUploading(true);
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) throw userError;
      if (!user) {
        throw new Error("You must be signed in to upload documents.");
      }

      const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, "_");
      const filePath = `${selectedCase}/${Date.now()}-${sanitizedFileName}`;

      const { error: uploadError } = await supabase.storage
        .from("documents")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: newDocument, error: insertError } = await supabase
        .from("documents")
        .insert({
          case_id: selectedCase,
          title: documentTitle,
          description: description || null,
          status,
          file_path: filePath,
          file_size: file.size,
          mime_type: file.type || null,
          uploaded_by: user.id,
        })
        .select(
          `
          id,
          title,
          created_at,
          status,
          file_path,
          file_size,
          mime_type,
          cases (
            title,
            case_number
          )
        `,
        )
        .single();

      if (insertError) throw insertError;

      setDocuments((prev) => (newDocument ? [newDocument, ...prev] : prev));
      handleDialogChange(false);
      toast({
        title: "Upload successful",
        description: "The document has been uploaded.",
      });
    } catch (error: any) {
      toast({
        title: "Upload failed",
        description: error.message || "Something went wrong during upload.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Documents</h1>
          <p className="text-muted-foreground mt-1 max-w-xl">
            Browse and manage all your legal documents
          </p>
        </div>
        <Button onClick={() => handleDialogChange(true)} className="md:self-start">
          <Upload className="w-4 h-4 mr-2" />
          Upload Document
        </Button>
      </div>

      <Dialog open={uploadDialogOpen} onOpenChange={handleDialogChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upload a new document</DialogTitle>
            <DialogDescription>
              Select a case, add document details, and choose a file to upload.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpload} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="case">Case</Label>
              <Select
                value={selectedCase}
                onValueChange={setSelectedCase}
                disabled={uploading || cases.length === 0}
              >
                <SelectTrigger id="case">
                  <SelectValue
                    placeholder={
                      cases.length === 0 ? "No cases available" : "Select a case"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {cases.map((caseItem) => (
                    <SelectItem key={caseItem.id} value={caseItem.id}>
                      {caseItem.title} ({caseItem.case_number})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={documentTitle}
                onChange={(event) => setDocumentTitle(event.target.value)}
                placeholder="Enter document title"
                disabled={uploading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="Optional description for this document"
                disabled={uploading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={status}
                onValueChange={setStatus}
                disabled={uploading}
              >
                <SelectTrigger id="status">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  {documentStatuses.map((documentStatus) => (
                    <SelectItem key={documentStatus} value={documentStatus}>
                      {documentStatus}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="file">File</Label>
              <Input
                id="file"
                type="file"
                onChange={(event) =>
                  setFile(event.target.files ? event.target.files[0] : null)
                }
                disabled={uploading}
              />
              {file && (
                <p className="text-sm text-muted-foreground">{file.name}</p>
              )}
            </div>

            <DialogFooter className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => handleDialogChange(false)}
                disabled={uploading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={uploading}>
                {uploading ? "Uploading..." : "Upload"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {loading ? (
        <div className="text-center py-8">Loading documents...</div>
      ) : documents.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="w-12 h-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No documents found</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {documents.map((doc) => (
            <Card key={doc.id} className="hover:shadow-md transition-shadow">
              <CardContent className="flex justify-between items-center py-4">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                    <FileText className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">{doc.title}</p>
                    <p className="text-sm text-muted-foreground">
                      {doc.cases?.title} ({doc.cases?.case_number})
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-sm text-muted-foreground">
                    {new Date(doc.created_at).toLocaleDateString()}
                  </span>
                  <Badge variant="outline">{doc.status}</Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default Documents;
