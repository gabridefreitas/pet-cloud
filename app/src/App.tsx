import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './components/AuthProvider'
import { Layout } from './components/layout/Layout'
import { RequireAuth } from './components/RequireAuth'
import { AdoptPage } from './pages/AdoptPage'
import { LoginPage } from './pages/auth/LoginPage'
import { RegisterPage } from './pages/auth/RegisterPage'
import { MyRequestsPage } from './pages/MyRequestsPage'
import { NotFoundPage } from './pages/NotFoundPage'
import { PetDetailsPage } from './pages/PetDetailsPage'

/**
 * Route map. Pages for logged-in users are wrapped in `RequireAuth`.
 * In AWS, CloudFront must rewrite these paths to `/index.html` (see aws/README.md).
 */
function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<Layout />}>
            {/* Until the landing page is built, the catalog is the home page. */}
            <Route index element={<Navigate to="/adopt" replace />} />
            <Route path="adopt" element={<AdoptPage />} />
            <Route path="pets/:id" element={<PetDetailsPage />} />
            <Route path="login" element={<LoginPage />} />
            <Route path="register" element={<RegisterPage />} />
            <Route
              path="my-requests"
              element={
                <RequireAuth role="adopter">
                  <MyRequestsPage />
                </RequireAuth>
              }
            />
            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App
