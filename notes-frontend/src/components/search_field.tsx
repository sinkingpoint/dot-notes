import React, { Component, ReactNode } from 'react';
import { Select } from 'antd';
import { APIClient } from '../api/client';

const { Option } = Select;

interface SearchFieldProps {
    placeholder?: string;
    className?: string;
    onCreatePage?: (name: string) => void;
}

interface SearchFieldState {
    contents: string;
}

class SearchField extends Component<SearchFieldProps, SearchFieldState> {
    constructor(props: SearchFieldProps) {
        super(props);

        this.state = {
            contents: ""
        };

        this.onSearch = this.onSearch.bind(this);
        this.onChange = this.onChange.bind(this);
    }
    
    onChange(val: string): void {
        if(val == "Create") {
            const api = new APIClient();
            api.create_note(this.state.contents).then(id => {
                window.location.pathname = `/note/${id}`
            }).catch(e => {
                console.log("Got an error creating a new page")
                console.log(e);
            });
        }
    }

    onSearch(val: string): void {
        this.setState({
            contents: val
        });
    }

    render(): ReactNode {
        const {className, placeholder} = this.props;
        const createOptionKey = `Create Page: ${this.state.contents}`;
        return <Select showSearch 
                    placeholder={placeholder || "Search or Create"}
                    style={{ width: 400, float: "right", margin: "15px" }}
                    optionFilterProp="children"
                    className={className} 
                    onSearch={this.onSearch}
                    onChange={this.onChange}
                >
            {this.state.contents && <Option value="Create">{createOptionKey}</Option>}
        </Select>;
    }
}

export default SearchField;