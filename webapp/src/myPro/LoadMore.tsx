import React from 'react';
import { Button, Result} from 'antd';



export const LoadMore: React.FC<{loadMoreState: boolean, loadMore: () => void,  isError?:boolean, errMsg?: string}>
    = ({ loadMoreState, loadMore, isError, errMsg }) =>
    loadMoreState ?
    <div style={{marginTop: 10, textAlign: 'center'}}> 
    <Button onClick={loadMore}>加载更多</Button> </div> : ( isError? <Result title={ errMsg || 'Something wrong' } />: null) 
    
