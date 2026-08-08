export type MlaPaClusterComplaintItem = {
  complaintId: number;
  category: string;
  subcategory: string | null;
  locality: string | null;
  sublocality: string | null;
  status: string;
  createdAt: string;
};

export type MlaPaClusterSummary = {
  clusterId: string;
  title: string;
  departmentName: string;
  category: string;
  subcategory: string | null;
  complaintsCount: number;
  createdAt: string;
  complaints: MlaPaClusterComplaintItem[];
};

export type MlaPaComplaintClusterCandidate = {
  id: number;
  category: string;
  subcategory: string | null;
  locality: string | null;
  sublocality: string | null;
  status: string;
  createdAt: string;
  currentClusterId: string | null;
};

export type GetMlaPaComplaintClustersResult =
  | {
      ok: true;
      clusters: MlaPaClusterSummary[];
      complaints: MlaPaComplaintClusterCandidate[];
    }
  | {
      ok: false;
      error: string;
    };

export type CreateMlaPaComplaintClusterInput = {
  title: string;
  complaintIds: number[];
};

export type CreateMlaPaComplaintClusterResult =
  | {
      ok: true;
      clusterId: string;
      complaintsCount: number;
    }
  | {
      ok: false;
      error: string;
    };

export type AttachComplaintToMlaPaClusterInput = {
  clusterId: string;
  complaintId: number;
};

export type AttachComplaintToMlaPaClusterResult =
  | {
      ok: true;
      clusterId: string;
      complaintId: number;
    }
  | {
      ok: false;
      error: string;
    };

export type DetachComplaintFromMlaPaClusterInput = {
  clusterId: string;
  complaintId: number;
};

export type DetachComplaintFromMlaPaClusterResult =
  | {
      ok: true;
      clusterId: string;
      complaintId: number;
    }
  | {
      ok: false;
      error: string;
    };
