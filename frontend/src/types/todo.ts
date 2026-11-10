export interface Todo {
  id: number;
  title: string;
  completed: boolean;
  created_at: string;
}

export interface TodoCreate {
  title: string;
  client_id?: string;
}

export interface TodoUpdate {
  title?: string;
  completed?: boolean;
}

export type Filter = "all" | "active" | "completed";
