import { Link } from 'react-router-dom';
import LoginForm from '@/features/auth/components/LoginForm';

const pageStyle: React.CSSProperties = {
  minHeight: '100vh',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '24px 16px',
  background: '#190331',
  backgroundImage:
    'radial-gradient(circle at 50% 100%, rgba(38,9,15,1) 0%, rgba(32,13,175,1) 33%, rgba(96,50,247,1) 66%, rgba(162,54,234,1) 100%)',
};

const cardStyle: React.CSSProperties = {
  width: '100%',
  maxWidth: '400px',
  backgroundColor: '#FFFFFF',
  borderRadius: '16px',
  padding: '28px',
  boxShadow: '0 10px 30px -5px rgba(0,0,0,0.15), 0 4px 10px -4px rgba(0,0,0,0.1)',
};

export default function LoginPage() {
  return (
    <div style={pageStyle}>
      <div style={{ marginBottom: '32px', textAlign: 'center' }}>
        <h1 style={{
          fontSize: '3.2rem', fontWeight: 700, color: '#FFFFFF',
          letterSpacing: '-1px', lineHeight: '4.2rem', margin: 0,
        }}>
          할일 목록 앱
        </h1>
        <p style={{
          color: 'rgba(255,255,255,0.65)', fontSize: '1.6rem', margin: '8px 0 0 0',
        }}>
          개인 할일 관리 앱
        </p>
      </div>

      <div style={cardStyle}>
        <LoginForm />
        <p style={{
          textAlign: 'center', marginTop: '20px',
          fontSize: '1.4rem', color: '#464748', margin: '20px 0 0 0',
        }}>
          아직 계정이 없으신가요?{' '}
          <Link to="/register" style={{ color: '#6157EA', fontWeight: 600, textDecoration: 'none' }}>
            회원가입
          </Link>
        </p>
      </div>
    </div>
  );
}
