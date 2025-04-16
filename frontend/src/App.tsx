// import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
// import { ThemeProvider, createTheme } from '@mui/material/styles';
// import CssBaseline from '@mui/material/CssBaseline';
// import Navbar from './components/Navbar';
// import Footer from './components/Footer';
// import Home from './pages/Home';
// import Login from './pages/Login';
// import Register from './pages/Register';
// import Profile from './pages/Profile';
// import SkillExchange from './pages/SkillExchange';
// import ServiceRequests from './pages/ServiceRequests';
// import Dashboard from './pages/Dashboard';

// const theme = createTheme({
//   palette: {
//     primary: {
//       main: '#1976d2',
//     },
//     secondary: {
//       main: '#dc004e',
//     },
//   },
// });

// function App() {
//   return (
//     <ThemeProvider theme={theme}>
//       <CssBaseline />
//       <Router>
//         <div className="app">
//           <Navbar />
//           <main style={{ minHeight: 'calc(100vh - 130px)', padding: '20px' }}>
//             <Routes>
//               <Route path="/" element={<Home />} />
//               <Route path="/login" element={<Login />} />
//               <Route path="/register" element={<Register />} />
//               <Route path="/profile" element={<Profile />} />
//               <Route path="/skill-exchange" element={<SkillExchange />} />
//               <Route path="/service-requests" element={<ServiceRequests />} />
//               <Route path="/dashboard" element={<Dashboard />} />
//             </Routes>
//           </main>
//           <Footer />
//         </div>
//       </Router>
//     </ThemeProvider>
//   );
// }

// export default App; 