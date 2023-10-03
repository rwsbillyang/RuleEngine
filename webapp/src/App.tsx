

import { useRoutes } from 'react-router-dom';
import { AppRoutes } from './AppRoutes'
//import { UseCacheConfig } from '@rwsbillyang/usecache';


function App() {
  //UseCacheConfig.EnableLog = false
  return useRoutes(AppRoutes);
}
export default App;