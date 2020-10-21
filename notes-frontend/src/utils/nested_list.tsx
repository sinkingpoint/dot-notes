export type NestedListData<T> = T | NestedList<T>;

type SourceData<T> = T | SourceData<T>[];
function listify<T>(data: SourceData<T>[]): NestedList<T> {
  const newData = data.map((val) => {
    if(val instanceof Array) {
      return listify(val);
    }
    else {
      return val;
    }
  });

  return new NestedList<T>(newData);
}

class NestedList<T> {
  data: NestedListData<T>[];
  constructor(data?: NestedListData<T> | NestedListData<T>[] | SourceData<T>[]) {
    if(data instanceof Array) {
      let hasArray = false;
      data.forEach((val: NestedListData<T> | SourceData<T>) => {
        if(val instanceof Array) {
          hasArray = true;
        }
      });

      if(!hasArray) {
        this.data = data as NestedListData<T>[];
      }
      else {
        this.data = (listify(data) as NestedList<T>).data;
      }
    }
    else if(data !== undefined) {
      this.data = [data];
    }
    else {
      this.data = [];
    }
  }

  clone(): NestedList<T> {
    // Quick and dirty for now. Need to fix
    let hasArray = false;
    this.data.forEach((val: NestedListData<T> | SourceData<T>) => {
      if(val instanceof Array) {
        hasArray = true;
      }
    });

    if(!hasArray) {
      return new NestedList<T>(this.data.slice());
    }

    return new NestedList<T>(this.data.map((val) => {
      if(val instanceof NestedList) {
        return val.clone();
      }

      return val;
    }));
  }

  get(indices: number[]): NestedListData<T> {
    if(indices.length == 1) {
      return this.data[indices[0]];
    }
    else {
      const data = this.data[indices[0]];
      if(data instanceof NestedList) {
        return data.get(indices.slice(1));
      }
      else {
        throw "Bad indices - non final index doesn't point to array";
      }
    }
  }

  set(indices: number[], newData: NestedListData<T>): void {
    if(indices.length == 1) {
      this.data[indices[0]] = newData;
    }
    else {
      const data = this.data[indices[0]];
      if(data instanceof NestedList) {
        data.set(indices.slice(1), newData);
      }
      else {
        throw "Bad indices - non final index doesn't point to array";
      }
    }
  }

  push(indices: number[], newData: NestedListData<T>): void {
    if(indices.length == 1) {
      const lastIndex = indices[0];
      const front = (this.data as NestedListData<T>[]).slice(0, lastIndex+1);
      const back = (this.data as NestedListData<T>[]).slice(lastIndex+1);
      this.data = front.concat([newData], back);
    }
    else {
      const data = this.data[indices[0]];
      if(data instanceof NestedList) {
        data.push(indices.slice(1), newData);
      }
      else {
        throw "Bad indices - non final index doesn't point to array";
      }
    }
  }

  delete(indices: number[]): void {
    if(indices.length == 1) {
      const lastIndex = indices[0];
      const front = (this.data as NestedListData<T>[]).slice(0, lastIndex);
      const back = (this.data as NestedListData<T>[]).slice(lastIndex+1);
      this.data = front.concat(back);
    }
    else {
      const data = this.data[indices[0]];
      if(data instanceof NestedList) {
        data.delete(indices.slice(1));

        // Remove the child array if it's now empty
        if((this.data[indices[0]] as NestedList<T>).data.length == 0) {
          this.data = this.data.slice(0, indices[0]).concat(this.data.slice(indices[0]+1, indices.length));
        }
      }
      else {
        throw "Bad indices - non final index doesn't point to array";
      }
    }
  }

  nest(indices: number[]): number[] {
    if(indices.length == 1) {
      const lastIndex = indices[0];
      const newData = this.data[lastIndex];
      // If the item before this is a nested list, just move this into it
      if(this.data[lastIndex-1] instanceof NestedList) {
        (this.data[lastIndex-1] as NestedList<T>).data.push(newData);
        this.delete(indices);

        const newIndex = (this.data[lastIndex-1] as NestedList<T>).data.length-1;

        // data[lastIndex] now contains the value of the item _after_ the item we just nested. 
        // If that is a nested list, for cleanlinesses sake, we merge them
        if(this.data[lastIndex] instanceof NestedList) {
          // Add all the second list to the first
          (this.data[lastIndex] as NestedList<T>).data.forEach((val) => {
            (this.data[lastIndex-1] as NestedList<T>).data.push(val);
          });

          // And delete it
          this.delete(indices);
        }

        return [lastIndex-1, newIndex];
      }
      // If the item _after_ this is a nested list, just move this into it
      else if(this.data[lastIndex+1] instanceof NestedList) {
        (this.data[lastIndex+1] as NestedList<T>).data = [newData].concat((this.data[lastIndex+1] as NestedList<T>).data);
        this.delete(indices);
        return [lastIndex, 0];
      }
      // Otherwise, make this a new nested list with this as the only element
      else {
        this.push(indices, new NestedList(newData));
        this.delete(indices);
        return [lastIndex, 0];
      }
    }
    else {
      const data = this.data[indices[0]];
      if(data instanceof NestedList) {
        return [indices[0]].concat(data.nest(indices.slice(1)));
      }
      else {
        throw "Bad indices - non final index doesn't point to array";
      }
    }
  }

  unnest(indices: number[]): number[] {
    if(indices.length == 1) {
      throw "Cannot unnest an element in the base list";
    }

    if(indices.length == 2) {
      const parentIndex = indices[0];
      const childIndex = indices[1];
      if(!(this.data[parentIndex] instanceof NestedList)) {
        throw "Bad indices - non final index doesn't point to array";
      }

      const parent = (this.data[parentIndex] as NestedList<T>);
      const child: NestedListData<T> = parent.data[childIndex];

      if(childIndex == 0) {
        // If we are unnesting the first element in the list, we can just move it before the list
        
        // If this is the only element in the parent list, slice this list to remove it
        const toAdd = parent.data.length == 1 ? this.data.slice(parentIndex+1, this.data.length) : this.data.slice(parentIndex, this.data.length);
        this.data = this.data.slice(0, parentIndex).concat([child], toAdd);
        parent.data.shift();
        return [parentIndex];
      }
      else if(childIndex == (this.data[parentIndex] as NestedList<T>).data.length-1) {
        // If we are unnesting the first element in the list, we can just move it after the list

        // If this is the only element in the parent list, slice this list to remove it
        const toAdd = parent.data.length == 1 ? this.data.slice(0, parentIndex) : this.data.slice(0, parentIndex+1);
        this.data = toAdd.concat([child], this.data.slice(parentIndex+1, this.data.length));
        parent.data.pop();
        return [parentIndex+1];
      }
      else {
        console.error("Middle unnesting currently unsupported");
      }
    }
    else {
      const data = this.data[indices[0]];
      if(data instanceof NestedList) {
        return [indices[0]].concat(data.unnest(indices.slice(1)));
      }
      else {
        throw "Bad indices - non final index doesn't point to array";
      }
    }
  }
}

export default NestedList;