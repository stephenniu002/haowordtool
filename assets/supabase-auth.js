// HaoWordTool Supabase Auth - 前端登录/评论
// Project: https://mhxmfhdluzebptfmxgpe.supabase.co
(function() {
  var SUPABASE_URL = 'https://mhxmfhdluzebptfmxgpe.supabase.co';
  var SUPABASE_ANON_KEY = 'sb_publishable_8o_fYc5QQT1E70dmjV2msA_571HyTkg';

  // 加载 Supabase JS
  function loadSupabase(cb) {
    if (window.supabase) return cb();
    var s = document.createElement('script');
    s.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2';
    s.onload = cb;
    document.head.appendChild(s);
  }

  var client = null;
  var currentUser = null;

  function init() {
    loadSupabase(function() {
      client = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
      checkAuth();
    });
  }

  function checkAuth() {
    client.auth.getSession().then(function(res) {
      currentUser = res.data.session ? res.data.session.user : null;
      renderAuthButton();
      if (typeof window.onAuthReady === 'function') window.onAuthReady(currentUser);
    });
    client.auth.onAuthStateChange(function(event, session) {
      currentUser = session ? session.user : null;
      renderAuthButton();
      if (typeof window.onAuthReady === 'function') window.onAuthReady(currentUser);
    });
  }

  function renderAuthButton() {
    // 找 nav，注入登录按钮
    var navs = document.querySelectorAll('nav .container, nav');
    if (!navs.length) return;
    var nav = navs[0];

    // 避免重复注入
    if (document.getElementById('hw-auth-btn')) {
      updateAuthButton();
      return;
    }

    var btn = document.createElement('a');
    btn.id = 'hw-auth-btn';
    btn.href = '#';
    btn.style.cssText = 'margin-left:12px;padding:6px 14px;border:1px solid rgba(255,255,255,.25);border-radius:20px;font-size:13px;cursor:pointer;white-space:nowrap;';
    btn.onclick = function(e) {
      e.preventDefault();
      if (currentUser) {
        if (confirm('退出登录？')) {
          client.auth.signOut().then(function() { location.reload(); });
        }
      } else {
        client.auth.signInWithOAuth({
          provider: 'google',
          options: { redirectTo: window.location.href }
        });
      }
    };
    nav.appendChild(btn);
    updateAuthButton();
  }

  function updateAuthButton() {
    var btn = document.getElementById('hw-auth-btn');
    if (!btn) return;
    if (currentUser) {
      var name = currentUser.user_metadata.full_name || currentUser.email.split('@')[0];
      btn.textContent = '👤 ' + name;
      btn.title = '点击退出';
    } else {
      btn.textContent = '登录';
      btn.title = 'Google 一键登录';
    }
  }

  // 对外暴露
  window.HWAuth = {
    getClient: function() { return client; },
    getUser: function() { return currentUser; },
    init: init
  };

  // 页面加载后初始化
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
