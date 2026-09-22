import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faGraduationCap, faClipboardList, faFileAlt, faFolderOpen, faFileSignature, faCertificate, faCircle, faCircleInfo, faGear, faBell, faCircleUser, faChevronLeft, faChevronRight, faInfo, faInfoCircle } from "@fortawesome/free-solid-svg-icons";
import "./HomePage.css";
import { toast, ToastContainer } from "react-toastify";
import { jwtDecode } from "jwt-decode";
import FirstLoginPopup from "./UserManagement/FirstLoginPopup";
import { isAdmin, getCurrentUser, hasRole } from "../utils/auth";
import BurgerMenuFI from "./FileInfo/BurgerMenuFI";
import Notifications from "./Notifications/Notifications";
import NotificationsHomePage from "./Notifications/NotificationsHomePage";
import BurgerMenuHomePage from "./FileInfo/BurgerMenuHomePage";
import InfoBurgerMenuHomePage from "./FileInfo/InfoBurgerMenuHomePage";

const HomePage = () => {
  const navigate = useNavigate();
  const access = getCurrentUser();
  const [showPopup, setShowPopup] = useState(localStorage.getItem("firstLogin") === "true");
  const [showNotifications, setShowNotifications] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [count, setCount] = useState("");
  const [profilePic, setProfilePic] = useState(null);
  const [startIndex, setStartIndex] = useState(0);
  const [animDir, setAnimDir] = useState(null);
  const [isInfoMenuOpen, setIsInfoMenuOpen] = useState(false);

  useEffect(() => {
    // Load from sessionStorage on mount
    const cached = sessionStorage.getItem('profilePic') || sessionStorage.getItem('profilePicStudent');
    setProfilePic(cached || null);
  }, []);

  const fetchNotificationCount = async () => {
    const route = `/api/notifications/count`;
    try {
      const response = await fetch(`${process.env.REACT_APP_URL}${route}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        }
      });
      if (!response.ok) {
        throw new Error('Failed to fetch notification count');
      }
      const data = await response.json();
      setCount(data.notifications);
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
    }
  };

  useEffect(() => {
    fetchNotificationCount();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    sessionStorage.removeItem("token");
    navigate("/FrontendDMS/");
  };

  const handleNavigateAdmin = () => {
    navigate("/FrontendDMS/admin");
  };

  const handleNavigateDash = () => {
    navigate("/FrontendDMS/mainDash");
  };

  const RAW_MENU = [
    {
      title: "Document Management", src: "DM.png", icon: faFolderOpen, path: "/FrontendDMS/documentManageHome", category: "DMS"
    },
    {
      title: "Document Development", src: "DC.png", icon: faFileSignature, path: "/FrontendDMS/documentCreateHome", category: "DDS"
    },
    {
      title: "Risk Management", src: "RM.png", icon: faClipboardList, path: "/FrontendDMS/riskHome", category: "RMS"
    },
    {
      title: "Training Management", src: "TM.png", icon: faGraduationCap, path: "/FrontendDMS/trainingHomePage", category: "TMS"
    },
    //{
    //  title: "EPA Management", src: "EPAM.png", icon: faGraduationCap, path: "/FrontendDMS/EPACSHome", category: "EPACS"
    //},
    {
      title: "Compliance Tracking", src: "CM.png", icon: faFileAlt, path: "/FrontendDMS/ctsHome", category: "CMS"
    },
    {
      title: "Field Templates", src: "FTSImg.png", icon: faFileAlt, path: "/FrontendDMS/ftsHome", category: "FTS"
    }
  ];

  const menuItems = useMemo(() => {
    if (!access) return [];
    return RAW_MENU
      .filter(item => {
        return hasRole(access, item.category);
      })
      // Strip gating fields before rendering (optional)
      .map(({ category, adminOnly, ...rest }) => rest);
  }, [access]);

  const visibleItems = useMemo(() => {
    const padded = [...menuItems];

    // Always ensure 5 items minimum
    while (padded.length < 5) {
      padded.push({ placeholder: true });
    }

    return padded.slice(startIndex, startIndex + 5);
  }, [menuItems, startIndex]);

  const canGoLeft = startIndex > 0;
  const canGoRight = startIndex + 5 < menuItems.length;

  return (
    <div className="homepage-container" style={{ userSelect: "none" }}>
      <div className="nl-floating-pill">
        <div className="burger-menu-icon-um notifications-bell-wrapper">
          <FontAwesomeIcon icon={faInfoCircle} onClick={() => setIsInfoMenuOpen(!isInfoMenuOpen)} title="Info" />
        </div>
        <div className="burger-menu-icon-um notifications-bell-wrapper">
          <FontAwesomeIcon icon={faBell} onClick={() => setShowNotifications(!showNotifications)} title="Notifications" />
          {count != 0 && <div className="notifications-badge"></div>}{/* Replace with unread count from backend later */}
        </div>
        <div className="burger-menu-icon-um" onClick={() => setIsMenuOpen(!isMenuOpen)} title="My Profile" style={{ cursor: "pointer" }}>
          {profilePic ? (
            <img
              src={profilePic}
              alt="Profile"
              style={{
                width: "28px",          // match icon size
                height: "28px",
                borderRadius: "50%",    // circle
                objectFit: "cover",
                display: "block"
              }}
            />
          ) : (
            <FontAwesomeIcon icon={faCircleUser} />
          )}
        </div>
      </div>
      {showPopup && (<FirstLoginPopup onClose={() => setShowPopup(false)} />)}
      <header className="header">
        <img src="CH_Logo.svg" alt="Logo" className="header-logo" />
        <h1>ComplianceHub{"\u2122"}</h1>
      </header>
      <div className="content-grid">
        <div className="carousel-container">

          <button
            className={`carousel-arrow left ${!canGoLeft ? "disabled" : ""}`}
            onClick={() => {
              if (canGoLeft) {
                setAnimDir("right");
                setStartIndex(startIndex - 1);
                setTimeout(() => setAnimDir(null), 250);
              }
            }}
          >
            <FontAwesomeIcon icon={faChevronLeft} />
          </button>

          <div className={`content-grid${animDir ? ` animating-${animDir}` : ""}`}>
            {visibleItems.map((item, index) => (
              <div
                key={index}
                className={`card ${item.placeholder ? "placeholder" : ""}`}
                onClick={() => !item.placeholder && navigate(item.path)}
              >
                {!item.placeholder && (
                  <>
                    <div className="card-content">
                      <img
                        src={`${process.env.PUBLIC_URL}/${item.src}`}
                        alt="Logo"
                        className={`${item.src === "TM.png" ? "card-icon-hat" : "card-icon"}
                ${item.src === "EPAM.png" ? "card-icon-flames" : ""}
                ${item.src === "DM.png" ? "card-icon-dm" : ""}
                ${item.src === "RM.png" ? "card-icon-rm" : ""}
                ${item.src === "DC.png" ? "card-icon-dc" : ""}
                ${item.src === "CM.png" ? "card-icon-cm" : ""}
                ${item.src === "FTSImg.png" ? "card-icon-fts" : ""}`}
                      />
                    </div>
                    <h3>
                      {item.title === "Field Templates" ? <>Field<br />Templates</> : item.title}
                    </h3>
                  </>
                )}
              </div>
            ))}
          </div>

          <button
            className={`carousel-arrow right ${!canGoRight ? "disabled" : ""}`}
            onClick={() => {
              if (canGoRight) {
                setAnimDir("left");
                setStartIndex(startIndex + 1);
                setTimeout(() => setAnimDir(null), 250);
              }
            }}
          >
            <FontAwesomeIcon icon={faChevronRight} />
          </button>

        </div>
      </div>
      <div className="logo-bottom-container">
        <img className="logo-bottom" src="logo.webp" alt="Bottom Logo" />
        <p className="logo-bottom-text">A TAU5 PRODUCT</p>
      </div>
      <button className={isAdmin(access) ? `admin-page-home-button` : `logout-button`} onClick={handleNavigateDash}>Dashboards</button>
      {isAdmin(access) && (<button className="logout-button" onClick={handleNavigateAdmin}>Admin Page</button>)}
      {false && (<button className="coming-soon-button" onClick={() => navigate("/FrontendDMS/futureEnhancement")}>Coming Soon</button>)}
      <ToastContainer />
      {showNotifications && (<NotificationsHomePage setClose={setShowNotifications} getCount={fetchNotificationCount} />)}
      {(isMenuOpen) && (<BurgerMenuHomePage isOpen={isMenuOpen} setIsOpen={setIsMenuOpen} />)}
      {(isInfoMenuOpen) && (<InfoBurgerMenuHomePage
        isOpen={isInfoMenuOpen} setIsOpen={setIsInfoMenuOpen}
        onProductPresentation={() => navigate(`/FrontendDMS/infoHelp/PRODUCT`)}
        onProductTraining={() => navigate(`/FrontendDMS/infoTraining/PRODUCT`)}
      />)}
    </div>
  );
};

export default HomePage;