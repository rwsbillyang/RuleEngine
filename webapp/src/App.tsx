

import { useRoutes } from 'react-router-dom';
import { AppRoutes } from './AppRoutes'


function App() {
  //UseCacheConfig.EnableLog = true
  return useRoutes(AppRoutes);
}
export default App;