// HaoWordTool 评论组件 - 用于博客文章页
// 用法: <div id="hw-comments" data-slug="article-slug"></div>
//       <script src="/assets/supabase-auth.js"></script>
//       <script src="/assets/comments.js"></script>
(function() {
  function initComments() {
    var container = document.getElementById('hw-comments');
    if (!container) return;
    var slug = container.getAttribute('data-slug') || window.location.pathname;

    // 等待 Auth 就绪
    function render() {
      var user = window.HWAuth ? window.HWAuth.getUser() : null;
      var client = window.HWAuth ? window.HWAuth.getClient() : null;
      if (!client) {
        setTimeout(render, 500);
        return;
      }

      container.innerHTML = '<div id="hw-comments-list"><p style="color:#888">加载评论中…</p></div>' +
        '<div id="hw-comment-form" style="margin-top:16px"></div>';

      loadComments(client, slug);

      var formDiv = document.getElementById('hw-comment-form');
      if (user) {
        formDiv.innerHTML =
          '<textarea id="hw-comment-input" maxlength="500" placeholder="写下你的评论（最多500字）…" ' +
          'style="width:100%;min-height:80px;padding:10px;border:1px solid #ddd;border-radius:8px;box-sizing:border-box"></textarea>' +
          '<button id="hw-comment-submit" style="margin-top:8px;padding:8px 20px;background:#1a73e8;color:#fff;border:none;border-radius:20px;cursor:pointer">发表评论</button>' +
          '<span id="hw-comment-msg" style="margin-left:10px;font-size:13px"></span>';
        document.getElementById('hw-comment-submit').onclick = function() {
          submitComment(client, slug, user);
        };
      } else {
        formDiv.innerHTML = '<p style="color:#888;background:#f5f5f5;padding:12px;border-radius:8px;text-align:center">' +
          '登录后参与评论</p>';
      }
    }

    if (window.HWAuth && window.HWAuth.getClient()) {
      render();
    } else {
      window.onAuthReady = render;
      // 兜底：如果 onAuthReady 已被覆盖，轮询
      var tries = 0;
      var timer = setInterval(function() {
        if ((window.HWAuth && window.HWAuth.getClient()) || ++tries > 20) {
          clearInterval(timer);
          if (window.HWAuth && window.HWAuth.getClient()) render();
        }
      }, 500);
    }
  }

  function loadComments(client, slug) {
    client.from('comments')
      .select('*')
      .eq('article_slug', slug)
      .eq('status', 'visible')
      .order('created_at', { ascending: false })
      .then(function(res) {
        var listDiv = document.getElementById('hw-comments-list');
        if (res.error) {
          listDiv.innerHTML = '<p style="color:#888">评论加载失败</p>';
          return;
        }
        var comments = res.data || [];
        if (!comments.length) {
          listDiv.innerHTML = '<p style="color:#888">暂无评论，来抢沙发吧 👇</p>';
          return;
        }
        var user = window.HWAuth.getUser();
        var html = '<h3 style="margin:0 0 12px">评论（' + comments.length + '）</h3>';
        comments.forEach(function(c) {
          var canDelete = user && user.id === c.user_id;
          html += '<div style="border-bottom:1px solid #eee;padding:10px 0">' +
            '<div style="font-size:13px;color:#666">' +
            escapeHtml(c.display_name || '匿名用户') +
            ' <span style="color:#aaa">' + new Date(c.created_at).toLocaleString('zh-CN') + '</span>' +
            (canDelete ? ' <a href="#" data-del="' + c.id + '" style="color:#c00;font-size:12px;margin-left:8px">删除</a>' : '') +
            '</div>' +
            '<div style="margin-top:4px">' + escapeHtml(c.content) + '</div>' +
            '</div>';
        });
        listDiv.innerHTML = html;
        // 绑定删除
        listDiv.querySelectorAll('[data-del]').forEach(function(a) {
          a.onclick = function(e) {
            e.preventDefault();
            if (confirm('删除这条评论？')) {
              client.from('comments').delete().eq('id', a.getAttribute('data-del'))
                .then(function() { loadComments(client, slug); });
            }
          };
        });
      });
  }

  var lastSubmit = 0;
  function submitComment(client, slug, user) {
    var now = Date.now();
    if (now - lastSubmit < 10000) {
      document.getElementById('hw-comment-msg').textContent = '操作太快了，休息10秒再发';
      return;
    }
    var input = document.getElementById('hw-comment-input');
    var content = input.value.trim();
    if (!content) {
      document.getElementById('hw-comment-msg').textContent = '先写点内容吧';
      return;
    }
    document.getElementById('hw-comment-msg').textContent = '发表中…';
    client.from('comments').insert({
      article_slug: slug,
      user_id: user.id,
      display_name: user.user_metadata.full_name || user.email.split('@')[0],
      content: content
    }).then(function(res) {
      if (res.error) {
        document.getElementById('hw-comment-msg').textContent = '发表失败：' + res.error.message;
      } else {
        lastSubmit = now;
        input.value = '';
        document.getElementById('hw-comment-msg').textContent = '发表成功！';
        loadComments(client, slug);
        setTimeout(function() {
          var m = document.getElementById('hw-comment-msg');
          if (m) m.textContent = '';
        }, 3000);
      }
    });
  }

  function escapeHtml(s) {
    var div = document.createElement('div');
    div.textContent = s;
    return div.innerHTML;
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initComments);
  } else {
    initComments();
  }
})();
