export type NestedListData<T> = T | NestedListData<T>[];
export type NestedListType<T> = NestedListData<T>[];

class NestedList<T> {
  data: NestedListType<T>;
  constructor(data?: NestedListType<T>) {
      this.data = data || [];
  }

  clone(): NestedList<T> {
    // Quick and dirty for now. Need to fix
    return new NestedList<T>(JSON.parse(JSON.stringify(this.data)));
  }

  get(indices: number[]): NestedListData<T> {
    let data = this.data;
    indices.slice(0, indices.length-1).forEach((index) => {
      if(data instanceof Array) {
        data = data[index] as NestedListType<T>;
      }
      else {
        throw "Bad indices - non final index doesn't point to array"
      }
    });

    return data[indices[indices.length-1]];
  }

  set(indices: number[], newData: NestedListData<T>): void {
    let data = this.data;
    indices.slice(0, indices.length-1).forEach((index) => {
      if(data instanceof Array) {
        data = data[index] as NestedListType<T>;
      }
      else {
        throw "Bad indices - non final index doesn't point to array"
      }
    });

    data[indices[indices.length-1]] = newData;
  }

  push(indices: number[], newData: NestedListData<T>): void {
    let data = this.data;

    if(indices.length == 1) {
      const lastIndex = indices[0];
      const front = (this.data as NestedListData<T>[]).slice(0, lastIndex+1);
      const back = (this.data as NestedListData<T>[]).slice(lastIndex+1);
      this.data = front.concat([newData], back);
    }
    else {
      indices.slice(0, indices.length-2).forEach((index) => {
        if(data instanceof Array) {
          data = data[index] as NestedListType<T>;
        }
        else {
          throw "Bad indices - non final index doesn't point to array"
        }
      });

      const secondToLastIndex = indices[indices.length-2];
      const lastIndex = indices[indices.length-1];
  
      if(!(data instanceof Array) || !((data[secondToLastIndex] instanceof Array))) {
        throw "Bad indices - non final index doesn't point to array"
      }
  
      const front = (data[secondToLastIndex] as NestedListData<T>[]).slice(0, lastIndex+1);
      const back = (data[secondToLastIndex] as NestedListData<T>[]).slice(lastIndex+1);
  
      data[secondToLastIndex] = front.concat([newData], back);
    }
  }

  delete(indices: number[]): void {
    let data = this.data;

    if(indices.length == 1) {
      const lastIndex = indices[0];
      const front = (this.data as NestedListData<T>[]).slice(0, lastIndex);
      const back = (this.data as NestedListData<T>[]).slice(lastIndex+1);
      this.data = front.concat(back);
    }
    else {
      indices.slice(0, indices.length-2).forEach((index) => {
        if(data instanceof Array) {
          data = data[index] as NestedListType<T>;
        }
        else {
          throw "Bad indices - non final index doesn't point to array"
        }
      });

      const secondToLastIndex = indices[indices.length-2];
      const lastIndex = indices[indices.length-1];
  
      if(!(data instanceof Array) || !((data[secondToLastIndex] instanceof Array))) {
        throw "Bad indices - non final index doesn't point to array"
      }
  
      const front = (data[secondToLastIndex] as NestedListData<T>[]).slice(0, lastIndex);
      const back = (data[secondToLastIndex] as NestedListData<T>[]).slice(lastIndex+1);
  
      data[secondToLastIndex] = front.concat(back);
    }
  }
}

export default NestedList;