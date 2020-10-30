export type NoteContents = string | NoteContents[];

export class Note {
    id?: string;
    title: string;
    contents: NoteContents[];
}

export class APIClient {
    apiBase: string;
    constructor(apiBase?: string) {
        this.apiBase = apiBase || "http://localhost:3030";
    }

    async get_note(id: string): Promise<Note> {
        const req = this._get(`/api/v1/note/${id}`);
        return req.then(resp => resp.json()) as Promise<Note>;
    }

    async create_note(name: string): Promise<string> {
        const req = this._post(`/api/v1/note`, {name: name});
        return req.then(resp => resp.json()).then(data => data['id']);
    }

    async update_note(id: string, note: Note): Promise<Response> {
        return this._put(`/api/v1/note/${id}`, note);
    }

    async search_note(query: string, limit: number): Promise<Note[]>  {
        const req = this._get(`/api/v1/note?query=${query}&limit=${limit}`);
        return req.then(resp => resp.json()) as Promise<Note[]>;
    }

    async _get(uri: string): Promise<Response> {
        return fetch(this.apiBase + uri);
    }

    async _post(uri: string, data?: any) {
        const options: RequestInit = {
            method: 'POST',
            headers: {
                "content-type": "application/json"
            }
        };

        if(data !== undefined) {
            options['body'] = JSON.stringify(data);
        }

        return fetch(this.apiBase + uri, options);
    }

    async _put(uri: string, data?: any) {
        const options: RequestInit = {
            method: 'PUT',
            headers: {
                "content-type": "application/json"
            }
        };

        if(data !== undefined) {
            options['body'] = JSON.stringify(data);
        }

        return fetch(this.apiBase + uri, options);
    }
}