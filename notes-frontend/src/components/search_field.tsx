import React, { Component, ReactNode, RefObject } from 'react';
import { AutoComplete } from 'antd';
import { APIClient, Note } from '../api/client';
import Select, { SelectValue } from 'antd/lib/select';

const { Option } = AutoComplete;

interface SearchFieldOption {
    key: string;
    prompt?: string;
    text: string;
}

interface SearchFieldProps {
    placeholder?: string;
    className?: string;
    style?: React.CSSProperties;
    searchPrompt?: string;
    onSelect?: (contents: string, val: string) => void;
    extraOptions?: (contents: string) => SearchFieldOption[];
}

interface SearchFieldState {
    contents: string;
    searchResults: Note[];
}

class SearchField extends Component<SearchFieldProps, SearchFieldState> {
    textBox: RefObject<Select<SelectValue>>;
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
        this.props.onSelect && this.props.onSelect(this.state.contents, val);
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

    focus(): void {
        if(this.textBox.current) {
            this.textBox.current.focus();
        }
    }

    render(): ReactNode {
        const {className, placeholder, style, searchPrompt, extraOptions} = this.props;
        const {contents, searchResults} = this.state;
        const regex = new RegExp(contents, "ig");

        const customOptions = extraOptions ? extraOptions(this.state.contents).map((option) => {
            return <Option value={option.key} key={option.key}>
                <span className="search-prompt">{option.prompt}</span>&nbsp;{option.text}
            </Option>
        }) : [];

        const searchOptions = searchResults == [] ? [] : searchResults.map((note) => {
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
                <span className="search-prompt">{searchPrompt}</span> {parts}
            </Option>
        });

        return <AutoComplete showSearch
                    ref={(ele) => {
                        this.textBox = {current: ele};
                    }}
                    placeholder={placeholder}
                    style={style}
                    className={className}
                    value={contents}
                    onSearch={this.onSearch}
                    onSelect={this.onSelect}
                    notFoundContent={null}
                    defaultActiveFirstOption={false}
                    showArrow={false}
                    filterOption={false}
                >
            {[...customOptions, ...searchOptions]}
        </AutoComplete>;
    }
}

export default SearchField;