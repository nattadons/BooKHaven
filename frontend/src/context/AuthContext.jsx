import { createContext, useContext, useState, useEffect } from 'react';
import PropTypes from 'prop-types';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [isLoggedIn, setIsLoggedIn] = useState(false);

    useEffect(() => {
        const loggedInStatus = localStorage.getItem('isLoggedIn') === 'true';
        setIsLoggedIn(loggedInStatus);  // ตรวจสอบแค่ isLoggedIn
    }, []);  // ดึงข้อมูลเพียงครั้งเดียวเมื่อ Component ถูกโหลด

    const login = (token,userId) => {
        localStorage.setItem('isLoggedIn', 'true');
        localStorage.setItem('authToken', token); // บันทึก token
        localStorage.setItem('userId', userId);
        setIsLoggedIn(true);
    };

    const logout = () => {
        localStorage.removeItem('isLoggedIn');
        sessionStorage.removeItem('checkoutData');
        localStorage.removeItem('userId');
        localStorage.removeItem('authToken'); // ลบ token

        setIsLoggedIn(false);
    };

    return (
        <AuthContext.Provider value={{ isLoggedIn, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

AuthProvider.propTypes = {
    children: PropTypes.node.isRequired,
};

export const useAuth = () => useContext(AuthContext);
