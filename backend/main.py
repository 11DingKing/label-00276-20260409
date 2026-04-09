# -*- coding: utf-8 -*-
"""
家具生产管理系统 - 桌面应用
PyQt6 + QWebEngineView + React/Ant Design
"""

import sys
import os
import threading
import time

os.environ['QT_MAC_WANTS_LAYER'] = '1'

from PyQt6.QtWidgets import (
    QApplication, QMainWindow, QWidget, QVBoxLayout,
    QSplashScreen, QLabel, QProgressBar, QHBoxLayout
)
from PyQt6.QtWebEngineWidgets import QWebEngineView
from PyQt6.QtWebEngineCore import QWebEngineProfile, QWebEnginePage
from PyQt6.QtCore import Qt, QUrl, QTimer, pyqtSignal, QObject
from PyQt6.QtGui import QPixmap, QColor, QFont

# 路径设置
BACKEND_DIR = os.path.dirname(os.path.abspath(__file__))
ROOT_DIR = os.path.dirname(BACKEND_DIR)
FRONTEND_DIR = os.path.join(ROOT_DIR, 'frontend-admin')
sys.path.insert(0, BACKEND_DIR)

from api.app import run_api_server
from database.init_db import run_init
from database.migrate import run_migrations


class LoadingSignals(QObject):
    progress = pyqtSignal(int, str)
    finished = pyqtSignal()
    error = pyqtSignal(str)


class LoadingSpinner(QWidget):
    def __init__(self, parent=None, size=40, color=QColor(255, 255, 255)):
        super().__init__(parent)
        self.setFixedSize(size, size)
        self._angle = 0
        self._color = color
        self._dot_count = 8
        self._dot_size = size // 8
        self._timer = QTimer(self)
        self._timer.timeout.connect(self._rotate)
        self._timer.start(80)
    
    def _rotate(self):
        self._angle = (self._angle + 30) % 360
        self.update()
    
    def paintEvent(self, event):
        import math
        from PyQt6.QtGui import QPainter, QBrush
        painter = QPainter(self)
        painter.setRenderHint(QPainter.RenderHint.Antialiasing)
        
        cx, cy = self.width() // 2, self.height() // 2
        radius = min(cx, cy) - self._dot_size
        
        for i in range(self._dot_count):
            angle = (self._angle + i * (360 // self._dot_count)) * math.pi / 180
            x = cx + radius * 0.7 * math.cos(angle) - self._dot_size // 2
            y = cy + radius * 0.7 * math.sin(angle) - self._dot_size // 2
            alpha = int(255 * (self._dot_count - i) / self._dot_count)
            color = QColor(self._color.red(), self._color.green(), self._color.blue(), alpha)
            painter.setBrush(QBrush(color))
            painter.setPen(Qt.PenStyle.NoPen)
            painter.drawEllipse(int(x), int(y), self._dot_size, self._dot_size)
    
    def stop(self):
        self._timer.stop()


class SplashScreen(QSplashScreen):
    def __init__(self):
        pixmap = QPixmap(520, 360)
        pixmap.fill(QColor("#1890ff"))
        super().__init__(pixmap)
        self.setWindowFlags(Qt.WindowType.WindowStaysOnTopHint | Qt.WindowType.FramelessWindowHint)
        
        layout = QVBoxLayout()
        layout.setContentsMargins(40, 35, 40, 35)
        layout.setSpacing(12)
        
        title = QLabel("家具生产管理系统")
        title.setStyleSheet("QLabel { color: white; font-size: 28px; font-weight: bold; }")
        title.setAlignment(Qt.AlignmentFlag.AlignCenter)
        layout.addWidget(title)
        
        subtitle = QLabel("企业级家具生产全流程管理平台")
        subtitle.setStyleSheet("QLabel { color: rgba(255, 255, 255, 0.8); font-size: 14px; }")
        subtitle.setAlignment(Qt.AlignmentFlag.AlignCenter)
        layout.addWidget(subtitle)
        
        layout.addStretch()
        
        spinner_layout = QHBoxLayout()
        spinner_layout.setAlignment(Qt.AlignmentFlag.AlignCenter)
        self.spinner = LoadingSpinner(size=50, color=QColor(255, 255, 255))
        spinner_layout.addWidget(self.spinner)
        layout.addLayout(spinner_layout)
        
        layout.addStretch()
        
        self.progress_bar = QProgressBar()
        self.progress_bar.setRange(0, 100)
        self.progress_bar.setValue(0)
        self.progress_bar.setTextVisible(False)
        self.progress_bar.setStyleSheet("""
            QProgressBar { border: none; border-radius: 5px; background-color: rgba(255, 255, 255, 0.3); height: 10px; }
            QProgressBar::chunk { border-radius: 5px; background: qlineargradient(x1:0, y1:0, x2:1, y2:0, stop:0 rgba(255,255,255,0.9), stop:1 rgba(255,255,255,1)); }
        """)
        layout.addWidget(self.progress_bar)
        
        container = QWidget(self)
        container.setLayout(layout)
        container.setGeometry(0, 0, 520, 360)
    
    def set_progress(self, value, message=""):
        self.progress_bar.setValue(value)
        self.repaint()
    
    def close(self):
        self.spinner.stop()
        super().close()


class MainWindow(QMainWindow):
    def __init__(self):
        super().__init__()
        self.init_ui()
    
    def init_ui(self):
        self.setWindowTitle("家具生产管理系统")
        self.setMinimumSize(1400, 900)
        
        screen = QApplication.primaryScreen().geometry()
        x = (screen.width() - 1400) // 2
        y = (screen.height() - 900) // 2
        self.setGeometry(x, y, 1400, 900)
        
        self.web_view = QWebEngineView()
        profile = QWebEngineProfile.defaultProfile()
        profile.setHttpCacheType(QWebEngineProfile.HttpCacheType.MemoryHttpCache)
        
        page = QWebEnginePage(profile, self.web_view)
        self.web_view.setPage(page)
        self.web_view.setContextMenuPolicy(Qt.ContextMenuPolicy.NoContextMenu)
        
        from PyQt6.QtWebEngineCore import QWebEngineSettings
        settings = self.web_view.settings()
        settings.setAttribute(QWebEngineSettings.WebAttribute.JavascriptEnabled, True)
        settings.setAttribute(QWebEngineSettings.WebAttribute.LocalStorageEnabled, True)
        settings.setAttribute(QWebEngineSettings.WebAttribute.LocalContentCanAccessRemoteUrls, True)
        
        self.setCentralWidget(self.web_view)
        self.load_web_app()
    
    def load_web_app(self):
        dist_path = os.path.join(FRONTEND_DIR, 'dist', 'index.html')
        if os.path.exists(dist_path):
            frontend_url = "http://127.0.0.1:3002"
        else:
            frontend_url = "http://127.0.0.1:3001"
        self.web_view.setUrl(QUrl(frontend_url))


def start_api_server():
    try:
        run_api_server(port=5000)
    except Exception as e:
        print(f"API服务器错误: {e}")


def start_frontend_server():
    import http.server
    import socketserver
    
    dist_path = os.path.join(FRONTEND_DIR, 'dist')
    if not os.path.exists(dist_path):
        return
    
    os.chdir(dist_path)
    handler = http.server.SimpleHTTPRequestHandler
    with socketserver.TCPServer(("127.0.0.1", 3002), handler) as httpd:
        httpd.serve_forever()


def init_application(signals):
    import socket
    
    try:
        signals.progress.emit(10, "")
        time.sleep(0.2)
        
        signals.progress.emit(20, "")
        run_migrations()
        
        signals.progress.emit(40, "")
        run_init()
        
        signals.progress.emit(55, "")
        api_thread = threading.Thread(target=start_api_server, daemon=True)
        api_thread.start()
        
        signals.progress.emit(65, "")
        for _ in range(15):
            time.sleep(1)
            try:
                sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
                sock.settimeout(1)
                result = sock.connect_ex(('127.0.0.1', 5000))
                sock.close()
                if result == 0:
                    break
            except:
                pass
        
        signals.progress.emit(75, "")
        signals.progress.emit(85, "")
        
        dist_path = os.path.join(FRONTEND_DIR, 'dist')
        if os.path.exists(dist_path):
            frontend_thread = threading.Thread(target=start_frontend_server, daemon=True)
            frontend_thread.start()
            time.sleep(1)
        
        signals.progress.emit(100, "")
        time.sleep(0.2)
        signals.finished.emit()
    except Exception as e:
        signals.error.emit(str(e))


def main():
    app = QApplication(sys.argv)
    app.setApplicationName("家具生产管理系统")
    app.setOrganizationName("FurniturePro")
    app.setFont(QFont("Microsoft YaHei", 10))
    
    splash = SplashScreen()
    splash.show()
    app.processEvents()
    
    signals = LoadingSignals()
    main_window = None
    
    def on_progress(value, message):
        splash.set_progress(value, message)
        app.processEvents()
    
    def on_finished():
        nonlocal main_window
        splash.close()
        main_window = MainWindow()
        main_window.show()
    
    def on_error(error_msg):
        splash.set_progress(0, f"错误: {error_msg}")
        print(f"启动错误: {error_msg}")
    
    signals.progress.connect(on_progress)
    signals.finished.connect(on_finished)
    signals.error.connect(on_error)
    
    init_thread = threading.Thread(target=init_application, args=(signals,))
    init_thread.start()
    
    sys.exit(app.exec())


if __name__ == "__main__":
    main()
