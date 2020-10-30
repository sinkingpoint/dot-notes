import React, { Component, ReactNode } from 'react';
import { AutoComplete } from 'antd';
import { APIClient, Note } from '../api/client';

const { Option } = AutoComplete;

interface SearchFieldProps {
    placeholder?: string;
    className?: string;
    onCreatePage?: (name: string) => void;
}

interface SearchFieldState {
    contents: string;
    searchResults: Note[];
}

class SearchField extends Component<SearchFieldProps, SearchFieldState> {
    constructor(props: SearchFieldProps) {
        super(props);

        this.state = {
            contents: "",
            searchResults: []
        };

        this.onSearch = this.onSearch.bind(this);
        this.onSelect = this.onSelect.bind(this);
    }
    
    onSelect(val: string): void {
        if(val == "Create") {
            const api = new APIClient();
            api.create_note(this.state.contents).then(id => {
                window.location.pathname = `/note/${id}`;
            }).catch(e => {
                console.log("Got an error creating a new page")
                console.log(e);
            });
        }
        else {
            window.location.pathname = `/note/${val}`;
        }
    }

    onSearch(val: string): void {
        const api = new APIClient();

        if(val != "") {
            api.search_note(val, 5).then(notes => {
                this.setState({
                    searchResults: notes,
                    contents: val
                });
            });
        }
        else {
            this.setState({
                contents: val,
                searchResults: []
            });
        }
    }

    render(): ReactNode {
        const {className, placeholder} = this.props;
        const {contents, searchResults} = this.state;
        const createOptionKey = `Create Page: ${contents}`;
        const regex = new RegExp(contents, "ig");
        const options = searchResults == [] ? [] : searchResults.map((note) => {
            let startIndex = 0;
            let parts = [];
            const title = note.title;
            while(startIndex < title.length) {
                let endIndex = title.substring(startIndex).search(regex);
                const highlight = endIndex == 0;
                if(endIndex == -1) {
                    endIndex = title.length;
                }
                else if(endIndex == 0) {
                    endIndex = startIndex + contents.length;
                }
                else {
                    endIndex = startIndex + endIndex;
                }

                parts.push({
                    contents: title.substring(startIndex, endIndex),
                    highlight: highlight
                });
                startIndex = endIndex;
            }

            parts = parts.map((part, i) => {
                const {contents, highlight} = part;
                return <span className={highlight ? 'search-highlight' : 'search-normal'} key={i}>{contents}</span>;
            });

            return <Option value={note.id} key={note.id}>
                Go To: {parts}
            </Option>
        });

        return <AutoComplete showSearch 
                    placeholder={placeholder || "Search or Create"}
                    style={{ width: 400, float: "right", margin: "15px" }}
                    className={className}
                    value={contents}
                    onSearch={this.onSearch}
                    onSelect={this.onSelect}
                    notFoundContent={null}
                    defaultActiveFirstOption={false}
                    showArrow={false}
                    filterOption={false}
                >
            {this.state.contents && <Option value="Create" key="Create">{createOptionKey}</Option>}
            {options}
        </AutoComplete>;
    }
}

export default SearchField;