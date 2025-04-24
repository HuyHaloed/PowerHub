import React from 'react';
import { Link } from 'react-router-dom';

export default function DashboardFooter() {
  return (
    <footer className="bg-white border-t p-4 text-sm text-gray-600">
      <div className="container mx-auto flex justify-between items-center">
        <div>
          © 2025 POWER HUB. All rights reserved. Code by Haloed's Team
        </div>
        <div className="flex space-x-4">
          <Link to="/privacy" className="hover:text-primary">
            Chính sách bảo mật
          </Link>
          <Link to="/terms" className="hover:text-primary">
            Điều khoản
          </Link>
          <Link to="/support" className="hover:text-primary">
            Hỗ trợ
          </Link>
        </div>
      </div>
    </footer>
  );
}