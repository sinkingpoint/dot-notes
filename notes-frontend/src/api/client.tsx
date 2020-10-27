type NoteContents = string | NoteContents[];

export class Note {
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
}