from django.core.management.base import BaseCommand
from django.db import transaction
from django.contrib.auth import get_user_model

User = get_user_model()


class Command(BaseCommand):
    help = (
        "Remove duplicate accounts that share the same email address. "
        "Keeps the earliest-created (and verified/preferred) account per email "
        "and deletes the redundant rows. Run BEFORE updating email to unique."
    )

    @transaction.atomic
    def handle(self, *args, **options):
        from django.db.models import Count

        dupes = (
            User.objects.values("email")
            .annotate(cnt=Count("id"))
            .filter(cnt__gt=1, email__gt="")
        )

        if not dupes:
            self.stdout.write(self.style.SUCCESS("No duplicate emails found. All clean."))
            return

        deleted_total = 0
        kept_total = 0
        for group in dupes:
            email = group["email"]
            candidates = list(User.objects.filter(email=email).order_by("id"))

            # Score each candidate: verified first, then non-empty profile, then oldest
            def score(u):
                return (
                    int(u.is_verified),
                    int(bool(u.profile_picture)),
                    int(u.role == "PROVIDER"),
                    -u.id,
                )

            keeper = max(candidates, key=score)
            to_delete = [u for u in candidates if u.id != keeper.id]

            # Move a ProviderProfile to keeper if there was only one and keeper lacks it
            for u in to_delete:
                if u.role == "PROVIDER" and keeper.role != "PROVIDER":
                    try:
                        if hasattr(u, "provider_profile") and not hasattr(keeper, "provider_profile"):
                            u.provider_profile.user = keeper
                            u.provider_profile.save()
                    except Exception:
                        pass

            for u in to_delete:
                u.delete()
                deleted_total += 1
            kept_total += 1
            self.stdout.write(f"email={email}: kept '{keeper.username}', removed {len(to_delete)} dup(s)")

        self.stdout.write(
            self.style.SUCCESS(f"Done. Kept {kept_total}, removed {deleted_total} duplicate account(s).")
        )