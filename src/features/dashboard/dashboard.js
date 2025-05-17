$(document).ready(function () {
    let allowSubmenuClick = false;

    // =====================
    // Sidebar Toggle
    // =====================
    $('#sidebarToggle').on('click', function () {
		const $sidebar = $('#sidebar');
		const isCollapsing = !$sidebar.hasClass('dashboard-ebm-collapsed');

		if (isCollapsing) {
			// Save currently expanded submenu IDs
			const openSubmenus = [];
			$('.dashboard-ebm-submenu.show').each(function () {
				openSubmenus.push($(this).attr('id'));
			});
			localStorage.setItem('dashboard-ebm-open-submenus', JSON.stringify(openSubmenus));

			// Collapse all submenus
			$('.dashboard-ebm-submenu').collapse('hide');
		} else {
			// Restore previously opened submenu IDs
			const savedSubmenus = JSON.parse(localStorage.getItem('dashboard-ebm-open-submenus') || '[]');
			savedSubmenus.forEach(id => {
				const $submenu = $('#' + id);
				$submenu.collapse('show');
			});
		}

		// Toggle sidebar collapse class
		$sidebar.toggleClass('dashboard-ebm-collapsed');

		// Toggle report button
		$('.dashboard-ebm-nav-report-btn').toggle(!$sidebar.hasClass('dashboard-ebm-collapsed'));
	});

    // =====================
    // Submenu Toggle Handler
    // =====================
    $('.dashboard-ebm-has-submenu > a').on('click', function (e) {
        const $sidebar = $('#sidebar');
        const isCollapsed = $sidebar.hasClass('dashboard-ebm-collapsed');
        const $link = $(this);
        const targetSelector = $link.attr('href');
        const $submenu = $(targetSelector);

        e.preventDefault();

        if (isCollapsed) {
            $sidebar.removeClass('dashboard-ebm-collapsed');
            allowSubmenuClick = false;
            return;
        }

        if (allowSubmenuClick) {
            $submenu.collapse('toggle');
        } else {
            allowSubmenuClick = true;
        }
    });

    // =====================
    // Sidebar Expand on Search Icon Click
    // =====================
    $('#searchToggle, .dashboard-ebm-search-only-icon').on('click', function () {
        if ($('#sidebar').hasClass('dashboard-ebm-collapsed')) {
            $('#sidebar').removeClass('dashboard-ebm-collapsed');
        }
    });

    // =====================
    // Submenu Expand Arrow Rotation
    // =====================
    $('.dashboard-ebm-submenu').on('shown.bs.collapse', function () {
        $(this).closest('.dashboard-ebm-has-submenu').addClass('expanded');
    });

    $('.dashboard-ebm-submenu').on('hidden.bs.collapse', function () {
        $(this).closest('.dashboard-ebm-has-submenu').removeClass('expanded');
    });

    // =====================
    // Initialize Expanded Arrows on Page Load
    // =====================
    $('.dashboard-ebm-has-submenu').each(function () {
        const $link = $(this).find('a');
        const target = $link.attr('href');
        const $submenu = $(target);

        if ($submenu.hasClass('show')) {
            $(this).addClass('expanded');
        }
    });

    // =====================
    // Set Current Month in <input type="month">
    // =====================
    const now = new Date();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const year = now.getFullYear();
    $('.month-selector').val(`${year}-${month}`);

    // =====================
    // Sidebar Search Logic
    // =====================
    const $input = $('.dashboard-ebm-search-input');
    const $clear = $('.dashboard-ebm-clear-search');

    $input.on('input', function () {
        const query = $input.val().toLowerCase().trim();

        // Toggle Clear Icon
        $clear.toggleClass('visible', query.length > 0);

        // Reset Menu Visibility
        $('#sidebarMenu .dashboard-ebm-nav-item').removeClass('d-none');
        $('#sidebarMenu .dashboard-ebm-submenu').removeClass('show');
        $('#sidebarMenu .dashboard-ebm-nav-item.dashboard-ebm-has-submenu').removeClass('expanded');
        $('#sidebarMenu .dashboard-ebm-submenu .dashboard-ebm-nav-link').removeClass('match');
        $('.dashboard-ebm-search-no-results').addClass('d-none');

        if (query === '') return;

        let anyMatch = false;

        $('#sidebarMenu .dashboard-ebm-nav-item').each(function () {
            const $item = $(this);
            const text = $item.text().toLowerCase();

            if ($item.hasClass('dashboard-ebm-has-submenu')) {
                const $submenuItems = $item.find('.dashboard-ebm-submenu .dashboard-ebm-nav-link');
                let matched = false;

                $submenuItems.each(function () {
                    const $submenuItem = $(this);
                    const itemText = $submenuItem.text().toLowerCase();

                    if (itemText.includes(query)) {
                        matched = true;
                        anyMatch = true;
                        $submenuItem.closest('li').removeClass('d-none');
                        $submenuItem.addClass('match');
                    } else {
                        $submenuItem.closest('li').addClass('d-none');
                    }
                });

                if (matched) {
                    $item.removeClass('d-none').addClass('expanded');
                    $item.find('.dashboard-ebm-submenu').addClass('show');
                } else {
                    $item.addClass('d-none');
                }
            } else {
                if (text.includes(query)) {
                    anyMatch = true;
                } else {
                    $item.addClass('d-none');
                }
            }
        });

        // Show "No results" message
        if (!anyMatch) {
            $('.dashboard-ebm-search-no-results').removeClass('d-none');
        }
    });

    // =====================
    // Clear Search Input
    // =====================
    $clear.on('click', function () {
        $input.val('').trigger('input').focus();
    });

    // =====================
    // ESC Key to Clear Input
    // =====================
    $input.on('keydown', function (e) {
        if (e.key === 'Escape') {
            $input.val('').trigger('input').blur();
        }
    });

    // =====================
    // Dummy Notification Data
    // =====================
    const notifications = [
        { title: "Bill Generated", time: "2 mins ago" },
        { title: "Payment Received", time: "10 mins ago" },
        { title: "Maintenance Updated", time: "1 hour ago" }
    ];

    // =====================
    // Render Notifications Dynamically
    // =====================
    function renderNotifications(data) {
        const badgeCount = data.length;
        let html = `
			<button class="btn text-white position-relative" id="notificationDropdown" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
				<i class="far fa-bell fa-lg"></i>`;

        if (badgeCount > 0) {
            html += `<span class="badge badge-danger position-absolute" style="top: 0; right: 0; font-size: 0.6rem;">${badgeCount}</span>`;
        }

        html += `</button>
			<div class="dropdown-menu dropdown-menu-right p-2" aria-labelledby="notificationDropdown" style="min-width: 250px; max-height: 300px; overflow-y: auto;">
				<h6 class="dropdown-header">Notifications</h6>
				<div class="dropdown-divider"></div>`;

        if (badgeCount === 0) {
            html += `<div class="text-center text-muted small">No new notifications</div>`;
        } else {
            data.forEach(note => {
                html += `
					<a class="dropdown-item small" href="#">
						<strong>${note.title}</strong><br>
						<small class="text-muted">${note.time}</small>
					</a>`;
            });
        }

        html += `<div class="dropdown-divider"></div>
				<a class="dropdown-item text-center text-primary small" href="#">View All</a>
			</div>`;

        $('#notificationArea').html(html);
    }

    renderNotifications(notifications);

    // =====================
    // Dummy User Data
    // =====================
    const user = {
        name: "A.K. Dubey",
        role: "Admin",
        status: "Offline",
        image: "img/AKDubey.png"
    };

    // =====================
    // Render User Profile Dropdown Dynamically
    // =====================
    function renderUserProfile(userData) {
        const html = `
			<button class="btn btn-outline-light btn-sm dropdown-toggle d-flex align-items-center" type="button" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
				<img src="${userData.image}" class="rounded-circle mr-2" width="32" height="32" alt="Profile">
				<span class="dashboard-ebm-user-status-text">${userData.status}</span>
			</button>
			<div class="dropdown-menu dropdown-menu-right">
				<div class="dropdown-item-text text-center">
					<img src="${userData.image}" class="rounded-circle mb-2" width="64" height="64" alt="Profile">
					<div><strong class="dashboard-ebm-user-name">${userData.name}</strong></div>
					<small class="text-muted dashboard-ebm-user-role">${userData.role}</small>
				</div>
				<div class="dropdown-divider"></div>
				<a class="dropdown-item toggle-status" href="#">
					<i class="fas fa-toggle-on mr-2"></i> Set Online/Offline
				</a>
				<a class="dropdown-item" href="#">
					<i class="fas fa-user mr-2"></i> Profile
				</a>
				<a class="dropdown-item text-danger" href="#">
					<i class="fas fa-sign-out-alt mr-2"></i> Logout
				</a>
			</div>`;

        $('.dashboard-ebm-profile-dropdown').html(html);
    }

    renderUserProfile(user);

    // =====================
    // Status Toggle Handler
    // =====================
    $(document).on('click', '.toggle-status', function (e) {
        e.preventDefault();
        user.status = (user.status === "Online") ? "Offline" : "Online";
        $('.dashboard-ebm-user-status-text').text(user.status);
    });
});
